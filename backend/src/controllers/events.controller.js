import {
  getAllEvents,
  createEvent,
  markEventAsPaid,
  deleteEvent,
} from "../services/events.service.js";

export const getEvents = async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postEvent = async (req, res) => {
  try {
    const newEvent = await createEvent(req.body);
    res.status(201).json(newEvent);
    res.json({
        message: "Event created!",
        newEvent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const patchEventPaid = async (req, res) => {
  try {
    const eventToPay = await markEventAsPaid(req.params.id);
    res.json({
        message: "Event paid!",
        eventToPay
    });;
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeEvent = async (req, res) => {
  try {
    await deleteEvent(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};