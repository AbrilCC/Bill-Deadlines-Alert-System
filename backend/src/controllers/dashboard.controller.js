import client from "../utils/supabaseClient.js";

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