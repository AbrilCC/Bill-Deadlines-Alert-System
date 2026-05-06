export const getAllEvents = async (client) => {
  const result = await client.query("SELECT * FROM events ORDER BY due_date ASC");
  return result.rows;
};

export const createSingleEvent = async (client, event) => {
  const { type, description, amount, due_date, source, email_id } = event;

  const result = await client.query(
    "INSERT INTO events (type, description, amount, due_date, paid, source, email_id) VALUES ($1, $2, $3, $4, false, $5, $6) RETURNING *",
    [type, description, amount, due_date, source, email_id]
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

  //Si tenemos una end_date la uso, sino automaticamente creo los events para 1 año
  const end = end_date
    ? new Date(new Date(end_date).getFullYear(), new Date(end_date).getMonth() + 1, 0)
    : (() => {
        const temp = new Date(start_date);
        temp.setFullYear(temp.getFullYear() + 1);
        return temp;
      })();

  const events = [];

  let current = new Date(start_date);
  const startDay = current.getDate();
  current.setDate(1); //This sets the day to be 1 to correctly calculate moving between months.

  while (current <= end) {
    const due_date = new Date(current);
    due_date.setDate(startDay);
    const res = await client.query(
      "INSERT INTO events (type, description, amount, due_date, paid, source, rule_id) VALUES ($1, $2, $3, $4, false, 'rule', $5) RETURNING *",
      [type, description, amount, due_date, rule.id]
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

export const markEventAsUnpaid = async (client, id) => {
  const result = await client.query(
    "UPDATE events SET paid = false WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

export const deleteEvent = async (client, id) => {
  await client.query("DELETE FROM events WHERE id = $1", [id]);
};