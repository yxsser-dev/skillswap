const db = require('../db');

exports.getSystemStats = async (req, res) => {
  try {
    const usersCount = await db.query('SELECT count(*) FROM users');
    const listingsCount = await db.query('SELECT count(*) FROM listings WHERE is_active = true');
    const bookingsCount = await db.query('SELECT count(*) FROM bookings');
    const reportsCount = await db.query("SELECT count(*) FROM reports WHERE status = 'pending'");

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      activeListings: parseInt(listingsCount.rows[0].count),
      totalBookings: parseInt(bookingsCount.rows[0].count),
      pendingReports: parseInt(reportsCount.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, 
              u_reporter.username as reporter_name, 
              u_reported.username as reported_username
       FROM reports r
       LEFT JOIN users u_reporter ON r.reporter_id = u_reporter.id
       JOIN users u_reported ON r.reported_user_id = u_reported.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveReport = async (req, res) => {
  const { id } = req.params;
  const { status, resolution_note } = req.body; // 'resolved', 'dismissed'

  try {
    const result = await db.query(
      'UPDATE reports SET status = $1, resolution_note = $2 WHERE id = $3 RETURNING *',
      [status, resolution_note, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setUserSuspension = async (req, res) => {
  const { id } = req.params;
  const { is_suspended } = req.body;

  try {
    const result = await db.query(
      'UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING id, username, is_suspended',
      [is_suspended, id]
    );

    // If suspended, drop all current active login sessions
    if (is_suspended) {
      await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};