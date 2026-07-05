const db = require('../db');

exports.createBooking = async (req, res) => {
  const { listing_id, teacher_id, session_time } = req.body;
  const learner_id = req.user.id;

  try {
    // making sure learner and teacher are different
    if (parseInt(teacher_id) === learner_id) {
      return res.status(400).json({ error: 'You cannot swap lessons with yourself.' });
    }

    const result = await db.query(
      `INSERT INTO bookings (listing_id, teacher_id, learner_id, session_time, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [listing_id, teacher_id, learner_id, session_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT b.*, 
              u_teacher.username as teacher_name, 
              u_learner.username as learner_name,
              s.name as skill_name
       FROM bookings b
       JOIN users u_teacher ON b.teacher_id = u_teacher.id
       JOIN users u_learner ON b.learner_id = u_learner.id
       LEFT JOIN listings l ON b.listing_id = l.id
       LEFT JOIN skills s ON l.skill_id = s.id
       WHERE b.teacher_id = $1 OR b.learner_id = $1
       ORDER BY b.session_time ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // accepted, rejected, completed, cancelled
  const userId = req.user.id;

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking transaction record not found' });
    }

    const booking = bookingRes.rows[0];

    // Completed Transition Rule
    if (status === 'completed') {
      if (booking.teacher_id !== userId) {
        return res.status(403).json({ error: 'Only the session teacher can mark this booking as completed.' });
      }
      if (booking.status !== 'accepted') {
        return res.status(400).json({ error: 'Session must be accepted first before marked complete.' });
      }
    }

    if (status === 'accepted' || status === 'rejected') {
      if (booking.teacher_id !== userId) {
        return res.status(403).json({ error: 'Only the listing host can accept/reject requests.' });
      }
    }

    const updatedRes = await db.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(updatedRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};