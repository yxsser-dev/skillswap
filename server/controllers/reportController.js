const { z } = require('zod');
const db = require('../db');

const reportSchema = z.object({
  reported_user_id: z.number().int(),
  listing_id: z.number().int().optional(),
  booking_id: z.number().int().optional(),
  reason: z.string().min(10).max(1000)
});

exports.createReport = async (req, res) => {
  try {
    const validated = reportSchema.parse(req.body);
    const { reported_user_id, listing_id, booking_id, reason } = validated;
    const reporter_id = req.user.id;

    if (reported_user_id === reporter_id) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const targetRes = await db.query('SELECT id FROM users WHERE id = $1', [reported_user_id]);
    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Reported user not found.' });
    }

    const result = await db.query(
      `INSERT INTO reports (reporter_id, reported_user_id, listing_id, booking_id, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [reporter_id, reported_user_id, listing_id || null, booking_id || null, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.errors ? err.errors : err.message });
  }
};
