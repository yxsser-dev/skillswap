const { z } = require('zod');
const db = require('../db');
const matchingService = require('../services/matchingService');

const listingSchema = z.object({
  skill_id: z.number().int(),
  type: z.enum(['offering', 'seeking']),
  description: z.string().min(10),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced']),
  availability: z.object({
    days: z.array(z.string()),
    times: z.array(z.string())
  })
});

exports.createListing = async (req, res) => {
  try {
    const validated = listingSchema.parse(req.body);
    const { skill_id, type, description, proficiency_level, availability } = validated;

    const result = await db.query(
      `INSERT INTO listings (user_id, skill_id, type, description, proficiency_level, availability)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, skill_id, type, description, proficiency_level, JSON.stringify(availability)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.errors ? err.errors : err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, s.name as skill_name, s.category as skill_category, u.username
       FROM listings l
       JOIN skills s ON l.skill_id = s.id
       JOIN users u ON l.user_id = u.id
       WHERE l.is_active = true AND u.is_suspended = false
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deactivateListing = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE listings SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Listing not found or unauthorized' });
    }
    res.json({ message: 'Listing soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const matches = await matchingService.calculateMatches(req.user.id);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};