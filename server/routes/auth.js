const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '30d' });

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ success: false, message: msg, errors: errors.array() });
  }
  
  try {
    const { name, email, password, profession, goals } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    console.log(`👤 Registering new user: ${email}`);
    const user = await User.create({ name, email, password, profession, goals });
    const token = generateToken(user._id);
    
    console.log(`✅ User registered successfully: ${user._id}`);
    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    // Handle MongoDB Duplicate Key Error (11000)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already registered. Please login instead.' 
      });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ success: false, message: msg, errors: errors.array() });
  }
  
  try {
    const { email, password } = req.body;
    console.log(`🔑 Login attempt: ${email}`);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`❌ Login failed: User not found (${email})`);
      return res.status(401).json({ success: false, message: "User doesn't exist, register first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Login failed: Password mismatch for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });
    
    const token = generateToken(user._id);
    console.log(`✅ Login successful: ${user.name}`);
    res.json({ success: true, token, user: user.toJSON() });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
});

// Get profile
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update profile
router.put('/me', protect, async (req, res) => {
  try {
    const allowed = ['name', 'profession', 'goals', 'theme', 'notifications', 'weeklySessionDay', 'avatar'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
