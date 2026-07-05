const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super_access_secret_123';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    
    // Check if the user is suspended
    const userRes = await db.query(
      'SELECT id, username, email, role, is_suspended FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    if (user.is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };