import client from "../utils/supabaseClient.js";
import {
    hashPassword,
    comparePasswords,
    generateToken
} from "../services/auth.service.js";
import { validatePassword } from "../utils/validators.js"


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
            return res.statur(500).json({error: "Invalid credentials"});
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