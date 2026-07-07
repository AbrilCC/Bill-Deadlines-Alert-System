import express from "express";
import cors from "cors";
import "./bot/telegramBot.js";
import dotenv from "dotenv";
dotenv.config();

import client from "./utils/supabaseClient.js";
import eventsRoutes from "./routes/events.routes.js";
import emailsRoutes from "./routes/emails.routes.js";
import authRoutes from "./routes/auth.routes.js";
import telegramLinkRoutes from "./routes/telegramLink.routes.js";
import userInfoRoutes from "./routes/userInfo.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import preferencesRoutes from "./routes/preferences.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import remindersRoutes from "./routes/reminders.routes.js";
import { startGmailSyncJob } from "./cron-jobs/gmailSync.job.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({
  origin: "https://alertavencimientos.vercel.app"
}));
app.use(express.json());

async function testDB() {
  try {
    const res = await client.query("SELECT NOW()");
    console.log(res.rows);
  } catch (err) {
    console.error("DB ERROR:", err);
  }
}
testDB();

app.use(eventsRoutes);
app.use(emailsRoutes);
app.use(authRoutes);
app.use(telegramLinkRoutes);
app.use(userInfoRoutes);
app.use(dashboardRoutes);
app.use(adminRoutes);
app.use(preferencesRoutes);
app.use("/upload", uploadRoutes);
app.use(remindersRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

startGmailSyncJob();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
