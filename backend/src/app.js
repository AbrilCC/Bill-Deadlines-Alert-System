import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import eventsRoutes from "./routes/events.routes.js";
import client from "./utils/supabaseClient.js";
import emailsRoutes from "./routes/emails.routes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});

async function testDB() {
  const res = await client.query("SELECT NOW()");
  console.log(res.rows);
}
testDB();

app.use(eventsRoutes);
app.use(emailsRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});
