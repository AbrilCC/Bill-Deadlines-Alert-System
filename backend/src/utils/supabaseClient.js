import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pkg;

//Connect Supabase as our Database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

export default client;