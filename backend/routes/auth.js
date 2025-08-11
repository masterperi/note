// auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');


const router = express.Router();

// ===================== REGISTER =====================
router.post('/register', async (req, res) => {
  try {
    const { name, college, phone, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const user = new User({ name, college, phone, email, password: hashedPwd });
    await user.save();

    res.status(201).json({ message: '✅ User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Registration failed' });
  }
});


// ===================== LOGIN =====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'defaultsecret', // keep in .env
      { expiresIn: '7d' } // 7 days expiry
    );

    res.status(200).json({
      message: '✅ Login successful',
      token,
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Login failed' });
  }
});

module.exports = router;
