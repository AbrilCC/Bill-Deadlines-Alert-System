import {
  getAuth,
  getEmails,
  getEmailDetail,
  getBody,
  getAttachments,
} from "./gmail.service.js";
import { parseInvoice, parseInvoiceFromText, detectType, extractTextFromImage } from "./parser.service.js";
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

export const syncEmailsService = async () => {
  try {
    const auth = await getAuth();
    const emails = await getEmails(auth);

    for (const email of emails) {
      const detail = await getEmailDetail(auth, email.id);
      const attachments = await getAttachments(auth, detail);
      const bodyText = await getBody(detail);
      const headers = detail.payload.headers;
      const subject = headers.find(h => h.name === "Subject")?.value || "";
      const from = headers.find(h => h.name === "From")?.value || "";
      const existing = await client.query(
        `SELECT 1 FROM events WHERE email_id = $1`,
        [email.id]
      );
      //console.log("EMAIL LINK: https://mail.google.com/mail/u/0/#inbox/", email_id);
      console.log("EMAIL:", email.id);
      console.log("EXISTING:", existing.rows);
      if (existing.rows.length > 0) continue;

      let parsed = null;

      if (attachments.length) {
        console.log("has some attachments");
        for (const att of attachments) {
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

            if (parsed?.amount && parsed?.due_date) break;
          }

          //Find images:
          if (!parsed && (att.filename.endsWith(".png") || 
              att.filename.endsWith(".jpg") ||
              att.filename.endsWith(".jpeg"))) {
                console.log("has an image, no pdf");
            const text = await extractTextFromImage(att.data);
            parsed = parseInvoiceFromText(text);
                  console.log("PARSED IMG:", parsed);


            if (parsed?.amount && parsed?.due_date) break;
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
        parsed = parseInvoiceFromText(combinedText);
        console.log("no-attachments-body has been parsed. PARSED:", parsed);
      }

      if (!parsed ||  !parsed.due_date) continue;

      console.log("PARSED:", parsed);
      console.log("DUE DATE:", parsed.due_date);
      console.log("FORMATTED:", formatDate(parsed.due_date));
      console.log({
        amount: parsed.amount,
        due_date: parsed.due_date,
        requires_manual_review:
          parsed.amount == null ||
          !parsed.due_date,
      });

      try {
        //Push the event to the DB
        await createSingleEvent(client, {
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