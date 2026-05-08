import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, "../../credentials.json");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const TRUSTED_SENDERS = [
    "avisos@aysadigital.com.ar",    //AGUA
    "facturadigital@edenor.com",    //LUZ
    "facturahuertomosconi.noresponder@rudis.com.ar",    //COLEGIO
    "no-reply@metrogas.com.ar",  //GAS
    "factura@email.claro.com.ar",   //CLARO
    "facturacion@email.personal.com.ar" //PERSONAL
];

const KEYWORDS = [
    "saldo",
    "vence",
    "vencimiento",
    "factura",
    "pago",
    "pagar"
];

const senderQuery = TRUSTED_SENDERS.map(sender => `from:${sender}`).join(" OR ");;
const keywordQuery = KEYWORDS.map(word => `subject:${word}`).join(" OR ");

/* Defino las queries en 1 solo lugar, ya que tengo 1 sola funcion para hacer queries */

//const query = `(from:(${senderQuery}) AND subject:(${keywordQuery})) newer_than:30d`;
const query = `(${keywordQuery}) newer_than:30d`;

export async function getAuth() {
    return await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
};

export async function getEmails(auth) {
    const gmail = google.gmail({ version: "v1", auth});

    const res = await gmail.users.messages.list({
        userId: "me", //The user authenticated with the token
        q: query,
    });

    return res.data.messages|| [];
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
    if (message.payload?.body?.data) {
        return Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    }
  const parts = message.payload?.parts || [];

  for (const part of parts) {
    if ((part.mimeType === "text/plain" || part.mimeType === "text/html") && part.body?.data) {
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
            //const buffer = Buffer.from(data, "base64");
            const fixedBase64 = data.replace(/-/g, "+").replace(/_/g, "/");

            const buffer = Buffer.from(fixedBase64, "base64");
            attachments.push({
                filename: part.filename,
                data: buffer,
            });
        }
    }
    return attachments;
};