export const createReminder = async (client, data) => {
  const { user_id, type, description, reminder_date, reminder_time } = data;
  const result = await client.query(
    `INSERT INTO reminders
    (user_id, type, description, reminder_date, reminder_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [user_id, type, description, reminder_date, reminder_time]
  );

  return result.rows[0];
};

export const getReminders = async (client, user_id) => {
  const result = await client.query(
    `SELECT *
    FROM reminders
    WHERE user_id = $1
    ORDER BY reminder_date ASC`,
    [user_id]
  );
    return result.rows;
};

export const deleteReminderById = async (client, id, user_id) => {
  await client.query(
    `DELETE FROM reminders WHERE id = $1 AND user_id = $2`,
    [id, user_id]
  );
};