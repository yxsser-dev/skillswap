const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../db');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super_access_secret_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_refresh_secret_123';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  bio: z.string().max(500).optional(),
  profile_picture_url: z.string().url().optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

function generateTokens(userId, role) {
  const accessToken = jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

exports.register = async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { username, email, password, bio, profile_picture_url } = validated;

    const userExists = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (userExists.rowCount > 0) {
      return res.status(400).json({ error: 'Username or Email is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, bio, profile_picture_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role`,
      [username, email, passwordHash, bio || '', profile_picture_url || '']
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Save refresh token to db
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ error: err.errors ? err.errors : err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (user.is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    // Retrieve active token matching current input session
    const dbTokenRes = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken, payload.userId]
    );

    if (dbTokenRes.rowCount === 0) {
      return res.status(403).json({ error: 'Invalid or expired session token' });
    }

    // Token rotation: Remove previous token
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [dbTokenRes.rows[0].id]);

    // Issue refreshed token pair
    const tokens = generateTokens(payload.userId, payload.role);
    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [payload.userId, tokens.refreshToken, nextExpiresAt]
    );

    res.json(tokens);
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh session' });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};