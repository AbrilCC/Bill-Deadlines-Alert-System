import express from "express";
import cors from "cors";
import "./bot/telegramBot.js";
import dotenv from "dotenv";
dotenv.config();

import client from "./utils/supabaseClient.js";
import eventsRoutes from "./routes/events.routes.js";
import emailsRoutes from "./routes/emails.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";


const app = express();
app.use(cors({
  origin: [process.env.FRONTEND_URL, "https://alertavencimientos.vercel.app/"]
}));
app.use(express.json());

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

async function testDB() {
  const res = await client.query("SELECT NOW()");
  console.log(res.rows);
}
testDB();

app.use(eventsRoutes);
app.use(emailsRoutes);
app.use(authRoutes);
app.use(dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});
