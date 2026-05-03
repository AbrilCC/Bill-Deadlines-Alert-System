export const getAllEvents = async (client) => {
  const result = await client.query("SELECT * FROM events ORDER BY due_date ASC");
  return result.rows;
};

export const createEvent = async (client, event) => {
  const { title, amount, due_date } = event;

  const result = await client.query(
    "INSERT INTO events (title, amount, due_date, paid) VALUES ($1, $2, $3, false) RETURNING *",
    [title, amount, due_date]
  );

  return result.rows[0];
};

export const markEventAsPaid = async (client, id) => {
  const result = await client.query(
    "UPDATE events SET paid = true WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

export const deleteEvent = async (client, id) => {
  await client.query("DELETE FROM events WHERE id = $1", [id]);
};