const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Lawyer = require("../models/lawyerModel");

const isAuthenticated = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    // Check if auth header exists and has the right format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token or invalid token format');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: No token provided or invalid format'
      });
    }
    
    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Token is empty after splitting');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Empty token'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: ' + error.message
    });
  }
};

module.exports = {
  isAuthenticated
};
