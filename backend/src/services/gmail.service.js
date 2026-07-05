import { google } from "googleapis";
import axios from "axios";

const KEYWORDS = [
    "saldo",
    "vence",
    "vencimiento",
    "importe",
    "pago",
    "pagar",
    "factura"
];
const keywordQuery = KEYWORDS.map(word => `subject:${word}`).join(" OR ");

export function getAuth(access_token, refresh_token) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
        access_token,
        refresh_token
    });

    return oauth2Client;
};

export async function getGmailAccount(auth) {
    const gmail = google.gmail({ version: "v1", auth});
    const profile = await gmail.users.getProfile({ userId: "me" });
    return profile.data.emailAddress;
}

export async function getEmails(auth, trustedSenders) {
    const gmail = google.gmail({ version: "v1", auth});
    console.log("CREDENTIALS:", auth.credentials);

    if (!trustedSenders.length) {
        return [];
    }
    const senderQuery = trustedSenders.map(sender => `from:${sender}`).join(" OR ");
    const query = `(${senderQuery}) AND (${keywordQuery}) newer_than:31d`;
    console.log(`QUERY: ${query}`);

    /*const profile = await gmail.users.getProfile({userId: "me"});
    console.log(profile.data);*/
    console.log("Antes de getProfile");
    try {
        console.time("gmail");
        const profile = await gmail.users.getProfile({
            userId: "me"
        });
        console.timeEnd("gmail");

        console.log("Después de getProfile");
        console.log(profile.data);

    } catch (err) {
        console.log("ERROR GETPROFILE");
        console.dir(err, { depth: null });
        throw err;
    }

    const res = await gmail.users.messages.list({
        userId: "me", //The user authenticated with the token
        q: query,
    });

    return res.data.messages || [];
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
                size: buffer.length,
            });
        }
    }
    return attachments;
};