import { createReminder, getReminders, deleteReminderById } from "../services/reminders.service.js";
import client from "../utils/supabaseClient.js";

export const postReminder = async (req, res) => {
  try {
    console.log("REQ.USER:", req.user);
    console.log("REQ.BODY:", req.body);
    console.log("USER ID:", req.user.id);
    const reminder = await createReminder(client, {user_id: req.user.id, ...req.body});
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchReminders = async (req, res) => {
  try {
    const reminders = await getReminders(client, req.user.id);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

export const deleteReminder = async (req, res) => {
  try {
    await deleteReminderById(client, req.params.id, req.user.id);
    res.json({message: "Reminder eliminado"});    
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};