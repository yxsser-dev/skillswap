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
  const { status, resolution_note } = req.body; // resolved or dismissed

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
    const targetRes = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (targetRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const target = targetRes.rows[0];

    if (target.role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts cannot be suspended.' });
    }
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot suspend your own account.' });
    }

    const result = await db.query(
      'UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING id, username, is_suspended',
      [is_suspended, id]
    );

    if (is_suspended) {
      await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, role, is_suspended, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllListings = async (req, res) => {
  try {
    // Unlike the public /listings endpoint, this returns EVERY listing
    // (including deactivated ones and listings from suspended users) so
    // admins have full visibility for moderation.
    const result = await db.query(
      `SELECT l.*, s.name as skill_name, u.username, u.is_suspended as owner_suspended
       FROM listings l
       JOIN skills s ON l.skill_id = s.id
       JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forceDeleteListing = async (req, res) => {
  const { id } = req.params;
  try {
    // Soft-delete, same as a user deactivating their own listing, but with
    // no ownership check — an admin can deactivate ANY listing.
    const result = await db.query(
      'UPDATE listings SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json({ message: 'Listing removed by admin', listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};