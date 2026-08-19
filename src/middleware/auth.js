const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'sports_partnership_super_secret_jwt_key_2026';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).populate('partnerRef');
    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

module.exports = { auth, JWT_SECRET };
