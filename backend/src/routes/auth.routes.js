import express from "express";
import { register, login, googleAuth, googleCallback } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);

export default router;