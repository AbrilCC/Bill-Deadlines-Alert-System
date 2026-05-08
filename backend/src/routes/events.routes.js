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

const router = express.Router();

router.get("/events", getEvents);
router.post("/events/single", createSingle);
router.post("/events/weekly", createWeekly);
router.post("/events/monthly", createMonthly)
router.patch("/events/:id", editEvent);
router.patch("/events/:id/pay", patchEventPaid);
router.patch("/events/:id/unpay", patchEventUnpaid);
router.delete("/events/:id", removeEvent);

export default router;