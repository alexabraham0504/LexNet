const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Lawyer = require('../models/lawyerModel');
const { getSpecializationForSection } = require('../utils/ipcUtils');
// Remove duplicate routes - they're now in lawyerRegistrationRoutes.js

router.get("/list", isAuthenticated, async (req, res) => {
  try {
    const { specialization } = req.query;
    
    // Build query object
    const query = {
      isVerified: true,
      visibleToClients: true
    };

    // Add specialization filter if provided
    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    // Find lawyers matching the query
    const lawyers = await Lawyer.find(query)
      .select('fullName email phone specialization location officeLocation availability appointmentFees')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: lawyers
    });

  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyers',
      error: error.message
    });
  }
});

router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { specialization } = req.query;
    
    console.log('Search params:', { specialization });

    // Add input validation
    if (specialization && !['Environmental Law', 'Criminal Law', 'Civil Law', 'Family Law', 'Real Estate Law', 'General Practice', 'All'].includes(specialization)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid specialization'
      });
    }

    const lawyers = await Lawyer.findBySpecialization(specialization);
    
    console.log(`Found ${lawyers.length} lawyers matching criteria`);

    if (lawyers.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No lawyers found for specialization: ${specialization}`,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: lawyers.map(lawyer => ({
        ...lawyer,
        id: lawyer._id,
        fullName: lawyer.fullName || 'Unknown',
        specialization: lawyer.specialization || 'General Practice'
      }))
    });

  } catch (error) {
    console.error('Lawyer search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for lawyers',
      error: error.message
    });
  }
});

// GET /api/lawyers - Get filtered lawyers
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { specialization, ipcSection, verified = true } = req.query;
    
    let query = {
      isVerified: verified === 'true',
      visibleToClients: true
    };

    if (specialization && specialization.toLowerCase() !== 'all') {
      query.specialization = specialization;
    }
    
    if (ipcSection) {
      query.ipcSections = ipcSection;
    }

    const lawyers = await Lawyer.find(query)
      .select('-password')
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      lawyers,
      message: lawyers.length ? undefined : 'No lawyers found matching the criteria'
    });

  } catch (error) {
    console.error('Error in GET /api/lawyers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 