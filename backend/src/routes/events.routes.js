import express from "express";
import {
  getEvents,
  createSingle,
  createWeekly,
  createMonthly,
  editEvent,
  patchEventPaid,
  patchEventUnpaid,
  patchRule,
  removeEvent,
  removeRule,
} from "../controllers/events.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/events", authMiddleware, getEvents);
router.post("/events/single", authMiddleware, createSingle);
router.post("/events/weekly", authMiddleware, createWeekly);
router.post("/events/monthly", authMiddleware, createMonthly);
router.post("/events/manual", authMiddleware, createSingle);

router.patch("/events/:id", authMiddleware, editEvent);
router.patch("/events/:id/pay", authMiddleware, patchEventPaid);
router.patch("/events/:id/unpay", authMiddleware, patchEventUnpaid);
router.patch("/rules/:id", authMiddleware, patchRule);

router.delete("/events/:id", authMiddleware, removeEvent);
router.delete("/rules/:id", authMiddleware, removeRule);

export default router;