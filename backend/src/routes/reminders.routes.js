import express from "express";
import { postReminder, fetchReminders, deleteReminder } from "../controllers/reminders.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/reminders", authMiddleware, fetchReminders);
router.post("/reminders", authMiddleware, postReminder);
router.delete("/reminders/:id", authMiddleware, deleteReminder);

export default router;