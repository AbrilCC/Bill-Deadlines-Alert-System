export async function getPreferences(req, res) {
    const userId = req.user.id;

    const result = await client.query(`
        SELECT preferred_days
        FROM user_payment_preferences
        WHERE user_id = $1
    `, [userId]);

    res.json(result.rows[0] || { preferred_days: [] });
};

export async function updatePreferences(req, res) {
    const userId = req.user.id;
    const { preferred_days } = req.body;

    await client.query(`
        INSERT INTO user_payment_preferences
        (user_id, preferred_days)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET preferred_days = $2
    `, [userId, preferred_days]);

    res.json({ success: true });
};