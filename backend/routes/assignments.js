const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignmentModel');
const auth = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
  console.log('Assignment route accessed:', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

// Create new case assignment
router.post('/create', auth, async (req, res) => {
  console.log('Create assignment endpoint hit');
  try {
    const { caseId, lawyerId, clientId, clientNotes, caseDetails } = req.body;
    
    // Log the received data
    console.log('Received assignment data:', {
      caseId,
      lawyerId,
      clientId,
      clientNotes,
      caseDetails
    });

    // Validate required fields
    if (!caseId || !lawyerId || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newAssignment = new Assignment({
      caseId,
      lawyerId,
      clientId,
      clientNotes,
      caseDetails,
      status: 'pending'
    });

    await newAssignment.save();
    console.log('Assignment saved successfully');

    res.status(201).json({
      success: true,
      message: 'Case assigned successfully',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning case',
      error: error.message
    });
  }
});

// Get assignments for a lawyer
router.get('/lawyer/:lawyerId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      lawyerId: req.params.lawyerId 
    }).populate('caseId clientId');
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// Make sure this is at the end of the file
module.exports = router; 