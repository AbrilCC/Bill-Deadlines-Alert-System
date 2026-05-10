import {
  getAllEvents,
  createSingleEvent,
  createWeeklyEvents,
  createMonthlyEvents,
  updateEvent,
  markEventAsPaid,
  markEventAsUnpaid,
  updateRule,
  deleteEvent,
  deleteRule,
} from "../services/events.service.js";
import client from "../utils/supabaseClient.js";

export const getEvents = async (req, res) => {
  try {
    const events = await getAllEvents(client, req.user.id);
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

    const event = await createSingleEvent(client, {...req.body, user_id: req.user.id});
    res.json(event);

  } catch (error) {
    console.error("ERROR CREATE SINGLE:", error);
    res.status(500).json({ error: error.message });
  }
}

export const createWeekly = async (req, res) => {
  try {
    const events = await createWeeklyEvents(client, {...req.body, user_id: req.user.id});
    res.json(events);
  } catch (error) {
    console.error("ERROR CREATE WEEKLY:", error);
    res.status(500).json({ error: error.message });
  }
}

export const createMonthly = async (req, res) => {
  try {
    const events = await createMonthlyEvents(client, {...req.body, user_id: req.user.id});
    res.json(events);
  } catch (error) {
    console.error("ERROR CREATE MONTHLY:", error);
    res.status(500).json({ error: error.message });
  }
}

export const editEvent = async (req, res) => {
  try {
    const event = await updateEvent(client, req.params.id, {...req.body, user_id: req.user.id});
    res.json({
        message: "Event edited!",
        event
    });;
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const patchEventPaid = async (req, res) => {
  try {
    const eventToPay = await markEventAsPaid(client, req.params.id, req.user.id);
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
    const event = await markEventAsUnpaid(client, req.params.id, req.user.id);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const patchRule = async (req, res) => {
  try {
    const updated = await updateRule(client, req.params.id, req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const removeEvent = async (req, res) => {
  try {
    await deleteEvent(client, req.params.id, req.user.id);
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeRule = async (req, res) => {
  try {
    await deleteRule(client, req.params.id, req.user.id);
    res.json({message: "Rule deleted!"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
}