import {
  //authorize,
  getEmails,
  getEmailDetail,
  getAttachments,
} from "../services/gmail.service.js";
import { authenticate } from "@google-cloud/local-auth";

export const syncEmails = async (req, res) => {
  try {
    //const auth = await authorize(); era otra forma de hacer authenticate
    const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath: "credentials.json",
    });

    const emails = await getEmails(auth);

    const results = [];

    for (const email of emails) {
      const detail = await getEmailDetail(auth, email.id);
      const attachments = await getAttachments(auth, detail);

      results.push({
        id: email.id,
        attachmentsCount: attachments.length,
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};