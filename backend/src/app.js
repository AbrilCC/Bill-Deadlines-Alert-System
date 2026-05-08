/*import express from "express";
import cors from "cors";
import "./bot/telegramBot.js";
import dotenv from "dotenv";
dotenv.config();

import client from "./utils/supabaseClient.js";
import eventsRoutes from "./routes/events.routes.js";
import emailsRoutes from "./routes/emails.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

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
app.use(dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

*/

import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});