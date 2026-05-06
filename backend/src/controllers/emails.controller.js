import {
  getAuth,
  getEmails,
  getEmailDetail,
  getBody,
  getAttachments,
} from "../services/gmail.service.js";
import { parseInvoice, parseInvoiceFromText, detectType } from "../services/parser.service.js";
import { createSingleEvent } from "../services/events.service.js";
import client from "../utils/supabaseClient.js";
//import { create } from "domain";

//Para que la fecha se vea día/mes/año
function formatDate(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}


export const syncEmails = async (req, res) => {
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
      if (existing.rows.length > 0) continue;

      let parsed = null;
      //We give priority to pdf files instead of body content
      if (attachments.length) {
        for (const att of attachments) {
          if (att.filename.endsWith(".pdf")) {
            parsed = await parseInvoice(att.data);
            break;
          }
        }
      } else if (bodyText) {
        parsed = parseInvoiceFromText(bodyText);
      }

      if (!parsed || !parsed.amount || !parsed.due_date) continue;

      try {
        //Push the event to the DB
        await createSingleEvent(client, {
          type: detectType(subject, from, bodyText),
          description: "Importado de gmail",
          amount: parsed.amount,
          due_date: formatDate(parsed.due_date),
          source: "gmail",
          email_id: email.id,
        });
      } catch (error) {
        if (error.code === "23505") continue; // duplicate key error
        throw error;
      }
    }
    res.json({ message: "Sync complete" });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};