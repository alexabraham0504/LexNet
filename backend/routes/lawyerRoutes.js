const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Lawyer = require('../models/lawyerModel');
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
    const { specialization, ipcSection, crimeType } = req.query;
    
    let query = {};
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    // Add additional filters if needed
    if (ipcSection) {
      query.ipcSections = ipcSection;
    }

    if (crimeType) {
      query.crimeTypes = crimeType;
    }

    const lawyers = await Lawyer.find(query)
      .select('fullName email phone specialization location fees rating')
      .lean();

    res.status(200).json({
      success: true,
      data: lawyers
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

module.exports = router; 