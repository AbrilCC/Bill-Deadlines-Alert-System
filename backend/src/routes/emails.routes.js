import express from "express";
import { syncEmails } from "../controllers/emails.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/emails/sync", authMiddleware, syncEmails);

export default router;