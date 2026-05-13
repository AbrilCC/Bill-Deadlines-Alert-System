import jwt from "jsonwebtoken";
import { google } from "googleapis";
import client from "../utils/supabaseClient.js";
import {
    hashPassword,
    comparePasswords,
    generateToken
} from "../services/auth.service.js";
import { validatePassword } from "../utils/validators.js"
import { getAuth, getGmailAccount } from "../services/gmail.service.js";
import { sendResetPasswordEmail } from "../services/mail.service.js"

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];


export const googleAuth = (req, res) => {
    const token = req.query.token;
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
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
    const token = req.query.state;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const auth = getAuth(tokens.access_token, tokens.refresh_token);
    const gmailAccount = await getGmailAccount(auth);

    const existingUser = await client.query(`
      SELECT google_refresh_token
      FROM users
      WHERE id = $1
      `, [decoded.id]
    );

    const refreshToken =
      tokens.refresh_token ||
      existingUser.rows[0]?.google_refresh_token;

    await client.query(`
      UPDATE users
      SET google_access_token = $1,
          google_refresh_token = $2,
          gmail_account = $3,
          gmail_connected = true
      WHERE id = $4
    `, [tokens.access_token, refreshToken, gmailAccount, decoded.id]);

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
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.json({
        message: "Si el email existe, se enviará un link"
      });
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendResetPasswordEmail(user.email, resetLink);

    res.json({
      message: "Mail enviado"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: "Contraseña inválida"
      });
    }

    const password_hash = await hashPassword(password);

    await client.query(
      `UPDATE users
      SET password_hash = $1
      WHERE id = $2`,
      [password_hash, decoded.id]
    );

    res.json({
      message: "Contraseña actualizada"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};