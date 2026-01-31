import express from 'express';
import { db } from './database';
import bcrypt from 'bcrypt';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // SQL injection vulnerability - using string interpolation
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = await db.query(query);
  
  if (user) {
    res.json({ token: user.id });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin endpoint without auth check
router.get('/admin/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});

// Password reset with weak token
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  const token = Math.random().toString(36);  // Weak random token
  
  await db.query(`UPDATE users SET reset_token = '${token}' WHERE email = '${email}'`);
  
  res.json({ success: true });
});

export default router;
