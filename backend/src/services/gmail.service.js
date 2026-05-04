import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { authenticate } from "@google-cloud/local-auth";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/*export async function authorize() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);

    const { client_secret, client_id, redirect_uris } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = fs.readFileSync("token.json");
    oAuth2Client.setCredentials(JSON.parse(token));

    return oAuth2Client;
};*/

export async function getAuth() {
    return await authenticate({
        scopes: SCOPES,
        keyfilePath: "credentials.json",
    });
};

export async function getEmails(auth) {
    const gmail = google.gmail({ version: "v1", auth});
    const res= await gmail.users.messages.list({
        userId: "me", //The user authenticated with the token
        q: 'subject:(Reunión OR Reunion)',
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