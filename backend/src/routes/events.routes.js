import express from "express";
import {
  getEvents,
  createSingle,
  createMonthly,
  patchEventPaid,
  removeEvent,
} from "../controllers/events.controller.js";

const router = express.Router();

router.get("/events", getEvents);
router.post("/events/single", createSingle);
router.post("/events/monthly", createMonthly)
router.patch("/events/:id/pay", patchEventPaid);
router.delete("/events/:id", removeEvent);

export default router;