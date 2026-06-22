import cron from "node-cron";
import client from "../utils/supabaseClient.js";
import { syncEmailsService } from "../services/emails.service.js";

export function startGmailSyncJob() {

    //Tue & Fri 4pm
    cron.schedule("0 16 * * 2,5", async () => {
        console.log("Running Gmail sync job...");
        try {
            const users = await client.query(
                `SELECT * FROM users WHERE gmail_connected = true`);
            for (const user of users.rows) {
                try {
                    await syncEmailsService(user.id);
                } catch (error) {
                    console.error(`Error syncing user ${user.id}`, error)
                }
            }
        } catch (error) {
            console.error("Cron job failed:", error);
        }
    }, {timezone: "America/Argentina/Buenos_Aires"});
}