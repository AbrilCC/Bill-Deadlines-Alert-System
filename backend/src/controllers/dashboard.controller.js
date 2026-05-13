import client from "../utils/supabaseClient.js";
import { editTrustedSenders } from "../services/events.service.js"

export const getDashboardStatus = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT
        gmail_connected,
        trusted_senders
      FROM users
      WHERE id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await client.query(`
      SELECT
        EXTRACT(DAY FROM due_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::int as day,
        SUM(amount)::numeric as total
      FROM events
      WHERE
        user_id = $1
      AND
        EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND
        EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY day
      ORDER BY day
    `, [user_id]);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

export const getSenders = async (req, res) => {
  try {
    const result = await client.query(
      `
      SELECT trusted_senders
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );
    res.json(
      result.rows[0]?.trusted_senders || []
    );

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


export const patchSenders = async (req, res) => {
  try {
    const validSenders = req.body.sendersArray
    .map(s => s.toLowerCase().trim())
    .filter(sender => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender));

    const senders = await editTrustedSenders(client, req.user.id, { sendersArray: validSenders });

    res.json(senders);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};
