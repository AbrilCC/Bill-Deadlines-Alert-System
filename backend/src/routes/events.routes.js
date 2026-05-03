import express from "express";
import {
  getEvents,
  postEvent,
  patchEventPaid,
  removeEvent,
} from "../controllers/events.controller.js";

const router = express.Router();

router.get("/events/", getEvents);
router.post("/events/", postEvent);
router.patch("/events/:id/pay", patchEventPaid);
router.delete("/events/:id", removeEvent);

export default router;