import {
  authorize,
  getEmails,
  getEmailDetail,
} from "../services/gmail.service.js";

async function test() {
  const auth = await authorize();

  const emails = await getEmails(auth);

  console.log("Emails encontrados:", emails.length);

  for (const email of emails) {
    const detail = await getEmailDetail(auth, email.id);

    console.log("ID:", email.id);
    console.log("Snippet:", detail.snippet);
    console.log("------");
  }
}

test();