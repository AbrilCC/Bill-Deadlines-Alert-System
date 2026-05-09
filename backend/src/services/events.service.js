export const getAllEvents = async (client, user_id) => {
  const result = await client.query("SELECT * FROM events WHERE user_id = $1 ORDER BY due_date ASC",
    [user_id]
  );
  return result.rows;
};

export const createSingleEvent = async (client, event) => {
  const { user_id, type, description, amount, due_date, source, email_id } = event;

  const result = await client.query(
    `INSERT INTO events 
    (user_id, type, description, amount, due_date, paid, source, email_id)
    VALUES ($1, $2, $3, $4, $5, false, $6, $7) 
    RETURNING *`,
    [user_id, type, description, amount, due_date, source, email_id]
  );

  return result.rows[0];
};

export const createWeeklyEvents = async (client, event) => {
  const { user_id, type, description, amount, start_date, end_date, weekday } = event;

  const ruleRes = await client.query(
    `
    INSERT INTO event_rules
    (user_id, type, description, payment_frequency, start_date, end_date, weekday)
    VALUES ($1, $2, $3, 'weekly', $4, $5, $6)
    RETURNING *
    `,
    [user_id, type, description, start_date, end_date, weekday]
  );

  const rule = ruleRes.rows[0];

  const events = [];

  let current = new Date(start_date);

  const targetWeekday = Number(weekday);

  // alineamos al weekday correcto
  while (current.getDay() !== targetWeekday) {
    current.setDate(current.getDate() + 1);
  }

  const end = end_date
    ? new Date(end_date)
    : (() => {
        const d = new Date(start_date);
        d.setFullYear(d.getFullYear() + 1);
        return d;
      })();

  while (current <= end) {

    const res = await client.query(
      `
      INSERT INTO events
      (user_id, type, description, amount, due_date, paid, source, rule_id)
      VALUES ($1, $2, $3, $4, $5, false, 'rule', $6)
      ON CONFLICT (rule_id, due_date)
      DO NOTHING
      RETURNING *
      `,
      [user_id, type, description, amount, current, rule.id]
    );

    if (res.rows[0]) {
      events.push(res.rows[0]);
    }

    // avanzar una semana
    current.setDate(current.getDate() + 7);
  }

  return events;
};


export const createMonthlyEvents = async (client, data) => {
  const { user_id, type, description, amount, start_date, end_date, payment_frequency } = data;

  //Create the rule
  const ruleRes = await client.query(
    `INSERT INTO event_rules
    (user_id, type, description, payment_frequency, start_date, end_date)
    VALUES ($1, $2, $3, 'monthly', $4, $5) RETURNING *`,
    [user_id, type, description, start_date, end_date]
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
      `INSERT INTO events
      (user_id, type, description, amount, due_date, paid, source, rule_id)
      VALUES ($1, $2, $3, $4, $5, false, 'rule', $6)
      ON CONFLICT (rule_id, due_date)
      DO NOTHING
      RETURNING *`,
      [user_id, type, description, amount, due_date, rule.id]
    );
    if (res.rows[0]) {
      events.push(res.rows[0]);
    }
    current.setMonth(current.getMonth() + 1);
  }
  return events;
};

export const updateEvent = async (client, id, data) => {
  const { user_id, type, description, amount, due_date } = data;
  const result = await client.query(
    `UPDATE events SET
      type = $1,
      description = $2,
      amount = $3,
      due_date = $4
      WHERE id = $5 AND user_id = $6 RETURNING *`,
    [type, description, amount, due_date, id, user_id]
  );

  return result.rows[0];
};

export const markEventAsPaid = async (client, id, user_id) => {
  const result = await client.query(
    "UPDATE events SET paid = true WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, user_id]
  );

  return result.rows[0];
};

export const markEventAsUnpaid = async (client, id, user_id) => {
  const result = await client.query(
    "UPDATE events SET paid = false WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, user_id]
  );
  return result.rows[0];
};

export const deleteEvent = async (client, id, user_id) => {
  await client.query("DELETE FROM events WHERE id = $1 AND user_id =$2", [id, user_id]);
};