const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername }).populate('partnerRef');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your upline partner or Platform Owner.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT Token valid for 7 days
    const payload = {
      id: user._id,
      username: user.username,
      partnerId: user.partnerId,
      partnerRef: user.partnerRef._id,
      level: user.level,
      roleTitle: user.roleTitle
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        partnerId: user.partnerId,
        partnerRef: user.partnerRef,
        level: user.level,
        roleTitle: user.roleTitle,
        name: user.partnerRef?.name || user.username,
        email: user.partnerRef?.email || '',
        phone: user.partnerRef?.phone || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user.partnerRef._id)
      .populate('parentId', 'partnerId name level roleTitle')
      .populate('uplines', 'partnerId name level roleTitle');

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          partnerId: req.user.partnerId,
          level: req.user.level,
          roleTitle: req.user.roleTitle,
          status: req.user.status,
          lastLogin: req.user.lastLogin
        },
        partner
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    user.password = await User.hashPassword(newPassword);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
