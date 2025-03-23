const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DocumentScan = require('../models/DocumentScan');
const { isAuthenticated } = require('../middleware/auth');

// Configure multer storage for document uploads
const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// POST: Save document scan
router.post('/save', isAuthenticated, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No document uploaded' 
      });
    }

    const { scanResult, caseId } = req.body;

    // Make sure we have scanResult data
    if (!scanResult) {
      return res.status(400).json({
        success: false,
        message: 'Scan result data is required'
      });
    }

    // Parse the scan result if it's provided as a string
    let parsedScanResult;
    try {
      parsedScanResult = typeof scanResult === 'string' 
        ? JSON.parse(scanResult) 
        : scanResult;
      
      console.log('Parsed scan result:', parsedScanResult);
    } catch (error) {
      console.error('Error parsing scan result:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid scan result format'
      });
    }

    // Check for userId in the decoded token - it's in req.user.userId, not req.user.id
    if (!req.user || !req.user.userId) {
      console.error('User ID not available in request object:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User authentication failed'
      });
    }

    // Read file content
    const filePath = req.file.path;
    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      return res.status(500).json({
        success: false,
        message: 'Error reading uploaded file'
      });
    }

    // Create new document scan record with validated data
    const newDocumentScan = new DocumentScan({
      fileName: req.file.originalname,
      originalFileContent: fileContent,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user.userId, // Use userId from the decoded token
      scanResult: {
        forgeryScore: parsedScanResult.forgeryScore,
        isForged: parsedScanResult.isForged,
        language: parsedScanResult.language || 'Unknown',
        details: parsedScanResult.details || []
      },
      caseId: caseId || null
    });

    // Save to database
    const savedScan = await newDocumentScan.save();
    console.log('Document scan saved successfully:', savedScan._id);

    // Delete the file from disk after saving to database
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      message: 'Document scan saved successfully',
      scanId: savedScan._id
    });
  } catch (error) {
    console.error('Error saving document scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save document scan',
      error: error.message
    });
  }
});

// GET: Get all scans for a user
router.get('/all', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const scans = await DocumentScan.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .select('-originalFileContent'); // Exclude the file content for performance

    res.status(200).json({
      success: true,
      scans
    });
  } catch (error) {
    console.error('Error fetching document scans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document scans',
      error: error.message
    });
  }
});

// GET: Get a specific scan by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    const scan = await DocumentScan.findById(scanId);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Document scan not found'
      });
    }

    // Check if user has permission
    if (scan.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      scan
    });
  } catch (error) {
    console.error('Error fetching document scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document scan',
      error: error.message
    });
  }
});

// Delete a scan
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    const scan = await DocumentScan.findById(scanId);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Document scan not found'
      });
    }

    // Check if user has permission
    if (scan.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await DocumentScan.findByIdAndDelete(scanId);

    res.status(200).json({
      success: true,
      message: 'Document scan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document scan',
      error: error.message
    });
  }
});

module.exports = router; 