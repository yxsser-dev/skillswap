const { z } = require('zod');
const db = require('../db');

exports.getPublicProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const userRes = await db.query(
      `SELECT u.id, u.username, u.bio, u.profile_picture_url, u.created_at,
              COALESCE(ROUND(AVG(rv.rating), 2), 0) as avg_rating,
              COUNT(DISTINCT rv.id) as review_count
       FROM users u
       LEFT JOIN reviews rv ON rv.reviewee_id = u.id
       WHERE u.id = $1 AND u.is_suspended = false
       GROUP BY u.id`,
      [id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const listingCountRes = await db.query(
      `SELECT COUNT(*) as count FROM listings WHERE user_id = $1 AND is_active = true`,
      [id]
    );

    res.json({
      ...userRes.rows[0],
      active_listings_count: parseInt(listingCountRes.rows[0].count, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserActivity = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `(SELECT 'listing' as type, l.created_at as event_time, s.name as skill_name, NULL::text as detail
        FROM listings l JOIN skills s ON l.skill_id = s.id
        WHERE l.user_id = $1)
       UNION ALL
       (SELECT 'review_received' as type, rv.created_at as event_time, NULL as skill_name, rv.comment as detail
        FROM reviews rv WHERE rv.reviewee_id = $1)
       UNION ALL
       (SELECT 'booking_completed' as type, b.updated_at as event_time, s2.name as skill_name, NULL as detail
        FROM bookings b
        JOIN listings l2 ON b.listing_id = l2.id
        JOIN skills s2 ON l2.skill_id = s2.id
        WHERE (b.teacher_id = $1 OR b.learner_id = $1) AND b.status = 'completed')
       ORDER BY event_time DESC
       LIMIT 10`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  bio: z.string().max(300).optional()
});

exports.updateMyProfile = async (req, res) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (validated.username !== undefined) {
      const existing = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [validated.username, req.user.id]
      );
      if (existing.rowCount > 0) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }
      updates.push(`username = $${paramIndex++}`);
      values.push(validated.username);
    }

    if (validated.bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(validated.bio);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    values.push(req.user.id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, bio, role, profile_picture_url`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.errors ? err.errors : err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const publicPath = `/uploads/avatars/${req.file.filename}`;
    const result = await db.query(
      `UPDATE users SET profile_picture_url = $1 WHERE id = $2 RETURNING id, username, email, bio, role, profile_picture_url`,
      [publicPath, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
