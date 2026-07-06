const db = require('../db');

exports.getSkills = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM skills ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSkill = async (req, res) => {
  const { name, category } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *',
      [name, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};