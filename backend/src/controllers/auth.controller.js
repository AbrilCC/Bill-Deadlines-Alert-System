import jwt from "jsonwebtoken";
import client from "../utils/supabaseClient.js";
import {
    hashPassword,
    comparePasswords,
    generateToken
} from "../services/auth.service.js";
import { validatePassword } from "../utils/validators.js"
import { oauth2Client } from "../services/gmail.service.js";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];


export const googleAuth = (req, res) => {
    const token = req.query.token;
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
        state: token
    });

    res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);

    const token = req.query.state;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await client.query(`
      UPDATE users
      SET google_access_token = $1,
          google_refresh_token = $2,
          gmail_connected = true
      WHERE id = $3
    `, [tokens.access_token, tokens.refresh_token, decoded.id]);

    res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!validatePassword(password)) {
        return res.status(400).json({
            error: "La contraseña debe tener mínimo 8 caracteres y contener letras y números"
        });
    }
        const existing = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (existing.rows.length > 0) {
            return res.status(401).json({error: "User already exists, please use another email account"});
        }
        const password_hash = await hashPassword(password);
        const result = await client.query(
            `INSERT INTO users(email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email`,
            [email, password_hash]);
        const user = result.rows[0];
        const token = generateToken(user);

        res.json({token, user});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        const user = result.rows[0];
        if (!user) {
            return res.status(500).json({error: "Invalid credentials"});
        }

        const valid = await comparePasswords(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({error: "Incorrect password"})
        }

        const token = generateToken(user);
        res.json({
            token,
            user: {id: user.id, email: user.email}
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}