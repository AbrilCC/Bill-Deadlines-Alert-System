import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

export async function comparePasswords(password, hash) {
    return await bcrypt.compare(password, hash);
}

export function generateToken(user) {
    return jwt.sign({
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "365d"
        }
    );
}
