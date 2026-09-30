import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_123456';

// 1. Register User
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );

    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.status(201).json({ user: rows[0], token });
  } catch (err) {
    console.error('[Register Error Details]:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 2. Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({ user: { id: rows[0].id, email: rows[0].email }, token });
  } catch (err) {
    console.error('[Login Error Details]:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;