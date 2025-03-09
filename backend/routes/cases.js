const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { analyzeDocument } = require('../controllers/caseController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST route for document analysis
router.post('/analyze', auth, upload.single('file'), async (req, res) => {
  try {
    const { text, type, metadata } = req.body;
    const file = req.file;

    if (!text || !file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Parse metadata if it's a string
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

    // Analyze the document
    const analysisResult = await analyzeDocument(text, file, type, parsedMetadata);

    res.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing document'
    });
  }
});

module.exports = router; 