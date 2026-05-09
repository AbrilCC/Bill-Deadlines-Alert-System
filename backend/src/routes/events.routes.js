import express from "express";
import {
  getEvents,
  createSingle,
  createWeekly,
  createMonthly,
  editEvent,
  patchEventPaid,
  patchEventUnpaid,
  removeEvent,
} from "../controllers/events.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/events", authMiddleware, getEvents);
router.post("/events/single", authMiddleware, createSingle);
router.post("/events/weekly", authMiddleware, createWeekly);
router.post("/events/monthly", authMiddleware, createMonthly)
router.patch("/events/:id", authMiddleware, editEvent);
router.patch("/events/:id/pay", authMiddleware, patchEventPaid);
router.patch("/events/:id/unpay", authMiddleware, patchEventUnpaid);
router.delete("/events/:id", authMiddleware, removeEvent);

export default router;