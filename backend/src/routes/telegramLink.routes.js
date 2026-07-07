import express from "express";
import crypto from "crypto";
import client from "../utils/supabaseClient.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

export async function generateTelegramLink(req, res) {
    const userId = req.user.id;
    const existing = await client.query(
        `SELECT chat_id FROM users WHERE id = $1`,
        [userId]
    );
    if (existing.rows[0].chat_id) {
        return res.json({
            url: "https://t.me/payment_deadlines_alert_bot"
        });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 10*60*1000);
    
    //Único token válido por usuario
    await client.query(`DELETE FROM telegram_tokens WHERE user_id = $1`, [userId]);

    await client.query(`
        INSERT INTO telegram_tokens (token, user_id, expires_at) VALUES($1, $2, $3)`,
    [token, userId, expires]);
    res.json({url:`https://t.me/payment_deadlines_alert_bot?start=${token}`});
}

router.post("/telegram/link", authMiddleware, generateTelegramLink);

export default router;