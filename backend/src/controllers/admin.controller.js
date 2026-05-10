import client from "../utils/supabaseClient.js";

export const getAdminData = async (req, res) => {
  try {
    const user_id = req.user.id;

    const single = await client.query(
      `SELECT *
      FROM events
      WHERE user_id = $1
      AND source = 'manual'
      AND rule_id IS NULL
      ORDER BY due_date ASC`,
      [user_id]
    );

    const weekly = await client.query(
      `SELECT *
      FROM event_rules
      WHERE user_id = $1
      AND payment_frequency = 'weekly'`,
      [user_id]
    );

    const monthly = await client.query(
      `SELECT *
      FROM event_rules
      WHERE user_id = $1
      AND payment_frequency = 'monthly'`,
      [user_id]
    );
    
    const gmail = await client.query(
      `SELECT *
      FROM events
      WHERE user_id = $1
      AND source = 'gmail'
      AND rule_id IS NULL
      ORDER BY due_date ASC`,
      [user_id]
    );

    res.json({
      single: single.rows,
      weekly: weekly.rows,
      monthly: monthly.rows,
      gmail: gmail.rows,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};