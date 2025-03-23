const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const { isAuthenticated } = require('../middleware/authMiddleware');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/temp');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Add this test route at the beginning of your routes
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OCR routes are working'
  });
});

// OCR text extraction endpoint
router.post('/extract-text', upload.single('image'), async (req, res) => {
  console.log('OCR route called!');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Check if file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      fs.unlinkSync(req.file.path); // Clean up
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is not an image'
      });
    }
    
    console.log('Processing image:', req.file.originalname, 'Size:', req.file.size);
    
    // Ensure directory exists with better error handling
    const dir = './uploads/temp';
    try {
      if (!fs.existsSync(dir)) {
        console.log('Creating temp directory at', path.resolve(dir));
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (dirError) {
      console.error('Failed to create directory:', dirError);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: dirError.message
      });
    }
    
    // Check if tesseract is available
    if (typeof createWorker !== 'function') {
      console.error('Tesseract.js not properly loaded');
      return res.status(500).json({
        success: false,
        message: 'OCR service not properly configured'
      });
    }
    
    // Initialize Tesseract worker
    const worker = await createWorker();
    console.log('OCR worker initialized');
    
    // Set language
    await worker.loadLanguage('eng+hin+mal+tam');
    await worker.initialize('eng+hin+mal+tam');
    console.log('OCR languages loaded');
    
    // Recognize text in image
    console.log('Starting OCR on', req.file.path);
    const { data } = await worker.recognize(req.file.path);
    console.log('OCR completed, text length:', data.text.length);
    
    // Terminate worker
    await worker.terminate();
    
    // Delete temporary file
    fs.unlinkSync(req.file.path);
    
    return res.status(200).json({
      success: true,
      text: data.text
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error.message
    });
  }
});

// Add a simple text response endpoint for testing
router.post('/simple-test', (req, res) => {
  console.log('Simple OCR test endpoint called');
  return res.status(200).json({
    success: true,
    message: 'OCR route is working',
    text: 'This is placeholder text from the OCR service'
  });
});

// Also add a GET version for easier browser testing
router.get('/simple-test', (req, res) => {
  console.log('Simple OCR test endpoint called (GET)');
  return res.status(200).json({
    success: true,
    message: 'OCR route is working',
    text: 'This is placeholder text from the OCR service'
  });
});

module.exports = router; 