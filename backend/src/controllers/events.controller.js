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
  editTrustedSenders,
} from "../services/events.service.js";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../services/googleCalendar.service.js";
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
    const userRes = await client.query(
      `SELECT google_access_token, google_refresh_token
      FROM users WHERE id = $1`,
      [req.user.id]
    )

    const user = userRes.rows[0];
    if (user?.google_refresh_token) {
      const calendarEventId = await createCalendarEvent(user, event);
      await client.query(
        `UPDATE events
        SET google_calendar_event_id = $1 WHERE id = $2`,
        [calendarEventId, event.id]
      )
    }
    res.json(event);

  } catch (error) {
    console.error("ERROR CREATE SINGLE:", error);
    res.status(500).json({ error: error.message });
  }
}

export const createWeekly = async (req, res) => {
  try {
    const { type, amount, due_date } = req.body;
    
    if (!type || !amount || !due_date) {
      return res.status(400).json({
        error: "Faltan campos obligatorios"
      });
    }
    const events = await createWeeklyEvents(client, {...req.body, user_id: req.user.id});
    const userRes = await client.query(
      `SELECT google_access_token, google_refresh_token
      FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (user?.google_refresh_token) {
      for (const event of events) {
        const calendarEventId = await createCalendarEvent(user, event);
        await client.query(
          `UPDATE events
          SET google_calendar_event_id = $1 WHERE id = $2`,
          [calendarEventId, event.id]
        );
      }
    }
    res.json(events);
  } catch (error) {
    console.error("ERROR CREATE WEEKLY:", error);
    res.status(500).json({ error: error.message });
  }
}

export const createMonthly = async (req, res) => {
  try {
    const { type, amount, due_date } = req.body;
    
    if (!type || !amount || !due_date) {
      return res.status(400).json({
        error: "Faltan campos obligatorios"
      });
    }
    const events = await createMonthlyEvents(client, {...req.body, user_id: req.user.id});
    const userRes = await client.query(
      `SELECT google_access_token, google_refresh_token
      FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (user?.google_refresh_token) {
      for (const event of events) {
        const calendarEventId = await createCalendarEvent(user, event);
        await client.query(
          `UPDATE events
          SET google_calendar_event_id = $1 WHERE id = $2`,
          [calendarEventId, event.id]
        );
      }
    }
    res.json(events);
  } catch (error) {
    console.error("ERROR CREATE MONTHLY:", error);
    res.status(500).json({ error: error.message });
  }
}

export const editEvent = async (req, res) => {
  try {
    const event = await updateEvent(client, req.params.id, {...req.body, user_id: req.user.id});
    if (event.google_calendar_event_id) {
       const userRes = await client.query(
        `SELECT google_access_token, google_refresh_token
        FROM users WHERE id = $1`,
        [req.user.id]
      );
      await updateCalendarEvent(userRes.rows[0], event.google_calendar_event_id, event)
    }
    res.json({ message: "Event edited!", event });;
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
    const events = await client.query(
      `SELECT * FROM events WHERE rule_id = $1AND user_id = $2`,
      [req.param.id, req.user.id]
    );
    const userRes = await client.query(
      `SELECT google_access_token, google_refresh_token
      FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (user?.google_refresh_token) {
      for (const event of events) {
        if (!event.google_calendar_event_id) continue;
        await updateCalendarEvent(userRes.rows[0], event.google_calendar_event_id, event);
      }
    }    
    res.json(updated);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const removeEvent = async (req, res) => {
  try {
    const eventRes = await client.query(
      `SELECT google_calendar_event_id
      FROM events WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    )
    const userRes = await client.query(
      `SELECT google_access_token, google_refresh_token
      FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (eventRes.rows[0]?.google_calendar_event_id) {
      await deleteCalendarEvent(userRes.rows[0], eventRes.rows[0].google_calendar_event_id)
    }
    await deleteEvent(client, req.params.id, req.user.id);
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeRule = async (req, res) => {
  try {
    const events = await client.query(
      `SELECT google_calendar_event_id
      FROM events WHERE rule_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const userRes = await client.query(
      `SELECT google_access_token, google_refresh_token
      FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (user?.google_refresh_token) {
      for (const event of events.rows) {
        if (!event.google_calendar_event_id) continue;
        await deleteCalendarEvent(userRes.rows[0], event.google_calendar_event_id);
      }
    }
    await deleteRule(client, req.params.id, req.user.id);
    res.json({message: "Rule deleted!"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
}