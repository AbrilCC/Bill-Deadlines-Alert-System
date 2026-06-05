import axios from "axios";
import * as cheerio from "cheerio";
import {
  getAuth,
  getEmails,
  getEmailDetail,
  getBody,
  getAttachments,
} from "./gmail.service.js";
import { parseInvoice, parseInvoiceFromText, detectType, extractTextFromImage, looksLikeInvoice } from "./parser.service.js";
import { createSingleEvent } from "./events.service.js";
import client from "../utils/supabaseClient.js";

//Para que la fecha se vea día/mes/año
function formatDate(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}

//Para no tomar info de imagenes irrelevantes con OCR
function isValidInvoiceText(text) {
  const lower = text.toLowerCase();

  const requiredKeywords = [
    "vencimiento",
    "factura",
    "importe",
    "total",
    "pagar"
  ];

  return requiredKeywords.some(word => lower.includes(word));
}

//Border case: this specific company that I know it uses an external link to get the amount info 
function extractClaroFacturaLink(html) {
    const $ = cheerio.load(html);
    let facturaLink = null;
    $("a").each((_, el) => {
        const text = $(el).text().trim().toLowerCase();

        if (text.includes("mirá tu factura") || text.includes("mira tu factura")) {
            facturaLink = $(el).attr("href");
        }
    });
    return facturaLink;
}
async function fetchClaroFacturaPage(url) {
    const response = await axios.get(url, {
        timeout: 10000
    });

    return response.data;
}
function parseClaroFacturaPage(html) {
    const text = html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ");
    const amountMatch = text.match(/total a pagar actualizado\s*\$?\s*([\d.,]+)/i);
    const dueDateMatch = text.match(/vencimiento\s*(\d{2}\/\d{2}\/\d{2,4})/i);
    return {
        amount: amountMatch
            ? normalizeAmount(amountMatch[1])
            : null,
        due_date: dueDateMatch
            ? dueDateMatch[1]
            : null
    };
}

export const syncEmailsService = async (user_id) => {
  try {
    const userRes = await client.query(
    `SELECT google_access_token, google_refresh_token
    FROM users
    WHERE id = $1`,
    [user_id]
    );
    const user = userRes.rows[0];

    if (!user?.google_refresh_token) {
      throw new Error("Tu sesión de Gmail expiró. Reconectá tu cuenta.");
    }
    const trustedSendersRes = await client.query(
      `SELECT trusted_senders
      FROM users
      WHERE id = $1`,
      [user_id]);

    const trustedSenders = trustedSendersRes.rows[0]?.trusted_senders || [];
    if (!trustedSenders.length) {
      throw new Error("Configura antes tus remitentes confiables en la Página Principal!");
    }

    const auth = getAuth(user.google_access_token, user.google_refresh_token);
    const emails = await getEmails(auth, trustedSenders);

    const uniqueThreads = new Map();
    for (const email of emails) {
      if (!uniqueThreads.has(email.threadId)) {
        uniqueThreads.set(email.threadId, email);
      }
    }
    const dedupedEmails = [...uniqueThreads.values()];

    for (const email of dedupedEmails) {
      const detail = await getEmailDetail(auth, email.id);
      const attachments = await getAttachments(auth, detail);
      const bodyText = await getBody(detail);
      console.log("BODY TEXT:", bodyText);
      const headers = detail.payload.headers;
      const subject = headers.find(h => h.name === "Subject")?.value || "";
      const from = headers.find(h => h.name === "From")?.value || "";
      const existing = await client.query(
        `SELECT 1 FROM events WHERE email_id = $1 AND user_id = $2`,
        [email.id, user_id]
      );

      console.log("EMAIL:", email.id);
      console.log("EXISTING:", existing.rows);
      if (existing.rows.length > 0) continue;

      //Border case: Claro mails
      if (from.toLowerCase().includes("factura@email.claro.com.ar")) {
        console.log("EL FROM AGARRO QUE VIENE DE CLARO!!!!!!")
        const facturaLink = extractClaroFacturaLink(bodyText);
        if (facturaLink) {
          try {
            const facturaHtml = await fetchClaroFacturaPage(facturaLink);
            parsed = parseClaroFacturaPage(facturaHtml);
            console.log("PARSED CLARO PAGE:", parsed);

          } catch (err) {
            console.log("Error parsing Claro page", err.message);
          }
        } 
      }//end of border case

      let parsed = null;

      if (attachments.length) {
        console.log("has some attachments");
        for (const att of attachments) {
          //Disregard big pdfs
          if (att.size > 5_000_000) {
            console.log("Skipping large attachment");
            continue;
          }

          //Find pdfs:
          if (att.filename.endsWith(".pdf")) {
            console.log("has a pdf");
            
            parsed = await parseInvoice(att.data);
                  console.log("PARSED PDF:", parsed);

            
            //OCR fallback if no data was found:
            if (parsed.amount == null && parsed.due_date == null) {
              console.log("has an image pdf");
              const text = await extractTextFromImage(att.data);
              if (isValidInvoiceText(text)){
                parsed = parseInvoiceFromText(text);
                    console.log("PARSED OCR:", parsed);
              }
            }

            if (parsed?.amount != null && parsed?.due_date) break;
          }

          //Find images:
          if (!parsed && (att.filename.endsWith(".png") || 
              att.filename.endsWith(".jpg") ||
              att.filename.endsWith(".jpeg"))) {
                console.log("has an image, no pdf");
            const text = await extractTextFromImage(att.data);
            parsed = parseInvoiceFromText(text);
                  console.log("PARSED IMG:", parsed);


            if (parsed?.amount != null && parsed?.due_date) break;
          }
        }
        //Find in body text:
          if ((!parsed || !parsed.amount || !parsed.due_date) && bodyText) {
            parsed = parseInvoiceFromText(bodyText);
                  console.log("PARSED BODY:", parsed);

          }
      } else if (bodyText || subject) {
        console.log("has no attachments");
        const combinedText = `${subject}\n${bodyText}`;
        if (!looksLikeInvoice(combinedText)) {
          console.log("Skipping non-invoice email");
          continue;
        }
        parsed = parseInvoiceFromText(combinedText);
        console.log("no-attachments-body has been parsed. PARSED:", parsed);
      }

      if (!parsed ||  !parsed.due_date) continue;

      try {
        //Push the event to the DB
        await createSingleEvent(client, {
          user_id,
          type: detectType(subject, from, bodyText),
          description: parsed.amount == null ? "Monto pendiente de completar" : "Importado de gmail",
          amount: parsed.amount,
          due_date: formatDate(parsed.due_date),
          source: "gmail",
          email_id: email.id,
          requires_manual_review: parsed.amount == null || !parsed.due_date,
        });
      } catch (error) {
        if (error.code === "23505") continue; // duplicate key error
        throw error;
      }
    }
    return { message: "Sync complete" };
  } catch (err) {
      throw err;
  }
};