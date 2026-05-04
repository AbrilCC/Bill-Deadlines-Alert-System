import {
  getAllEvents,
  createSingleEvent,
  createMonthlyEvents,
  markEventAsPaid,
  deleteEvent,
} from "../services/events.service.js";
import client from "../utils/supabaseClient.js";

export const getEvents = async (req, res) => {
  try {
    const events = await getAllEvents(client);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createSingle = async (req, res) => {
  const event = await createSingleEvent(client, req.body);
  res.json(event);
}

export const createMonthly = async (req, res) => {
  const events = await createMonthlyEvents(client, req.body);
  res.json(events);
}

export const patchEventPaid = async (req, res) => {
  try {
    const eventToPay = await markEventAsPaid(client, req.params.id);
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
    await deleteEvent(client, req.params.id);
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};