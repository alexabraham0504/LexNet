const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Implement document fetching logic here
    // For now, return empty array to prevent errors
    res.json([]);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ 
      message: 'Error fetching documents',
      error: error.message 
    });
  }
});

module.exports = router; 