const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const createAuthPayload = (user) => {
  const token = jwt.sign(
    { userId: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

const looksHashedPassword = (value = '') => typeof value === 'string' && value.startsWith('$2');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required' });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name: normalizedName, email: normalizedEmail, password: hashedPassword });
    await user.save();

    res.status(201).json({
      msg: 'User registered successfully',
      ...createAuthPayload(user),
    });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    let isMatch = false;

    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (_error) {
      isMatch = false;
    }

    // Support older accounts that may have been stored before hashing was applied.
    if (!isMatch && user.password === password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
      isMatch = true;
    }

    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    res.json(createAuthPayload(user));
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Debug user by email without exposing the real password
router.get('/debug-user', async (req, res) => {
  try {
    const rawEmail = req.query.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ msg: 'email query parameter is required' });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      return res.json({
        exists: false,
        email: normalizedEmail,
      });
    }

    return res.json({
      exists: true,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordStored: Boolean(user.password),
      passwordFormat: looksHashedPassword(user.password) ? 'hashed' : 'legacy_or_plaintext',
    });
  } catch (err) {
    console.error('Debug user error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
