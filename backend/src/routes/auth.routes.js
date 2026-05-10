import express from "express";
import {
    register,
    login,
    googleAuth,
    googleCallback,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

export default router;