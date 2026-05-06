import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, "../../credentials.json");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
//const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/* Defino las queries en 1 solo lugar, ya que tengo 1 sola funcion para hacer queries */
const rules = [
  /*{ query: '(subject:(Factura OR factura)) AND (from:(banco@gmail.com OR empresa@gmail.com))' },
  { query: '(subject:(Factura OR factura)) AND (from:(banco@gmail.com OR empresa@gmail.com)) (has:attachment filename:pdf)' },
  { query: 'subject:(Vencimiento OR vence)' },*/
  { query: 'subject:(saldo vence)' },
];

export async function getAuth() {
    return await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
};

export async function getEmails(auth) {
    const gmail = google.gmail({ version: "v1", auth});
    let allMessages = [];

    for (const rule of rules) {
        const res = await gmail.users.messages.list({
            userId: "me", //The user authenticated with the token
            q: rule.query,
        });
        allMessages = [...allMessages, ...(res.data.messages || [])];
    }
    return allMessages;
};

export async function getEmailDetail(auth, messageId) {
    const gmail = google.gmail({ version: "v1", auth});
    const res = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
    });
    return res.data;
};

export function getBody(message) {
  const parts = message.payload?.parts || [];

  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8");
    }

    if (part.mimeType === "text/html" && part.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8");
    }
  }

  return "";
}

export async function getAttachments(auth, message) {
    const gmail = google.gmail({ version: "v1", auth});
    const parts = message.payload?.parts || [];
    const attachments = [];

    for (const part of parts) {
        if (part.filename && part.body.attachmentId) {
            const att = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId: message.id,
                id: part.body.attachmentId,
            });
            
            const data = att.data.data;
            const buffer = Buffer.from(data, "base64");
            attachments.push({
                filename: part.filename,
                data: buffer,
            });
        }
    }
    return attachments;
};