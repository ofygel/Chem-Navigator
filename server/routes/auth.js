import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db.js';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const setCookie = (res, token) =>
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

// Регистрация
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || password?.length < 6)
    return res.status(400).json({ msg: 'Некорректные данные' });

  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id',
      [email.toLowerCase(), hash]
    );
    const token = signToken(rows[0].id);
    setCookie(res, token);
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ msg: 'Email уже зарегистрирован' });
  }
});

// Вход с паролем
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT id, password_hash FROM users WHERE email=$1',
    [email.toLowerCase()]
  );
  if (!rows[0]) return res.status(400).json({ msg: 'Неверные данные' });

  const match = await bcrypt.compare(password, rows[0].password_hash);
  if (!match) return res.status(400).json({ msg: 'Неверные данные' });

  setCookie(res, signToken(rows[0].id));
  res.json({ ok: true });
});

// Вход через Google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const email = ticket.getPayload().email.toLowerCase();

    let { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!rows[0]) {
      ({ rows } = await pool.query(
        'INSERT INTO users(email, provider) VALUES($1, $2) RETURNING id',
        [email, 'google']
      ));
    }

    setCookie(res, signToken(rows[0].id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ msg: 'Ошибка Google авторизации' });
  }
});

// Получение текущего пользователя
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ msg: 'Нет токена' });

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT email FROM users WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ msg: 'Пользователь не найден' });
    res.json({ email: rows[0].email });
  } catch {
    res.status(401).json({ msg: 'Неверный токен' });
  }
});

// Выход
router.post('/logout', (_, res) => {
  res.clearCookie('token').json({ ok: true });
});

export default router;