export async function getCurrentUser(req, res) {
    const userId = req.user.id;

    const result = await client.query(`
        SELECT email, gmail_account
        FROM users
        WHERE id = $1
    `, [userId]);

    res.json(result.rows[0]);
}