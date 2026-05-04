export const getAllEvents = async (client) => {
  const result = await client.query("SELECT * FROM events ORDER BY due_date ASC");
  return result.rows;
};

export const createSingleEvent = async (client, event) => {
  const { type, description, amount, due_date } = event;

  const result = await client.query(
    "INSERT INTO events (type, description, amount, due_date, paid, source) VALUES ($1, $2, $3, $4, false, 'manual') RETURNING *",
    [type, description, amount, due_date]
  );

  return result.rows[0];
};

export const createMonthlyEvents = async (client, data) => {
  const { type, description, amount, start_date, end_date, payment_frequency } = data;

  //Create the rule
  const ruleRes = await client.query(
    "INSERT INTO event_rules (type, description, payment_frequency, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [type, description, payment_frequency, start_date, end_date]
  );
  const rule = ruleRes.rows[0];

  let current = new Date(start_date);
  //Si tenemos una end_date la uso, sino automaticamente creo los events para 1 año
  const end = end_date ? new Date(end_date) : new Date(current.setFullYear(current.getFullYear() + 1));

  const events = [];

  while (current <= end) {
    const res = await client.query(
      "INSERT INTO events (type, description, amount, due_date, paid, source, rule_id) VALUES ($1, $2, $3, $4, false, 'rule', $5) RETURNING *",
      [type, description, amount, current, rule.id]
    );
    events.push(res.rows[0]);
    current.setMonth(current.getMonth() + 1);
  }
  return events;
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