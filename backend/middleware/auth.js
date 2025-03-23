const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Lawyer = require("../models/lawyerModel");

const isAuthenticated = async (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers.authorization);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Authorization header or incorrect format');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Verify token - add your JWT_SECRET from .env
    const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-for-testing';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Token decoded successfully:', decoded);
      
      // Set user in request
      req.user = decoded;
      
      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = {
  isAuthenticated
};
