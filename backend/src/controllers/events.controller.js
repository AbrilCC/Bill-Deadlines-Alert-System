import {
  getAllEvents,
  createSingleEvent,
  createMonthlyEvents,
  markEventAsPaid,
  markEventAsUnpaid,
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
  try {
    const { type, amount, due_date } = req.body;
    
    if (!type || !amount || !due_date) {
      return res.status(400).json({
        error: "Faltan campos obligatorios"
      });
    }

    const event = await createSingleEvent(client, req.body);
    res.json(event);

  } catch (error) {
    console.error("ERROR CREATE SINGLE:", error);
    res.status(500).json({ error: error.message });
  }
}

export const createMonthly = async (req, res) => {
  try {
    const events = await createMonthlyEvents(client, req.body);
    res.json(events);
  } catch (error) {
    console.error("ERROR CREATE MONTHLY:", error);
    res.status(500).json({ error: error.message });
  }
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

export const patchEventUnpaid = async (req, res) => {
  try {
    const event = await markEventAsUnpaid(client, req.params.id);
    res.json(event);
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