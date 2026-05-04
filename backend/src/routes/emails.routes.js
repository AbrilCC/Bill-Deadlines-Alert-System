import express from "express";
import { syncEmails } from "../controllers/emails.controller.js";

const router = express.Router();

router.get("/emails/sync", syncEmails);

export default router;