const db = require('../db');

exports.createReview = async (req, res) => {
  const { booking_id, rating, comment } = req.body;
  const reviewer_id = req.user.id;

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bookingRes.rowCount === 0) {
      return res.status(404).json({ error: 'Target booking was not found' });
    }

    const booking = bookingRes.rows[0];

    // status must be completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed sessions.' });
    }

    // Determine target reviewer
    let reviewee_id;
    if (booking.learner_id === reviewer_id) {
      reviewee_id = booking.teacher_id;
    } else if (booking.teacher_id === reviewer_id) {
      reviewee_id = booking.learner_id;
    } else {
      return res.status(403).json({ error: 'You are not a registered participant of this session.' });
    }

    const result = await db.query(
      `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking_id, reviewer_id, reviewee_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'You have already submitted a review for this session.' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.getReviewsForUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      `SELECT r.*, u.username as reviewer_name 
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};