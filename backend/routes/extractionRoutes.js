const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const textract = require('textract');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// PDF extraction endpoint
router.post('/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    console.log('Processing PDF:', req.file.originalname);

    // Extract text from PDF using pdf-parse
    const dataBuffer = req.file.buffer;
    
    try {
      const data = await pdf(dataBuffer);
      console.log('Extracted text length:', data.text.length);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      res.json({ 
        success: true,
        text: data.text 
      });
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      res.status(422).json({ 
        success: false,
        error: 'Failed to parse PDF content',
        details: pdfError.message 
      });
    }

  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to extract text from PDF',
      details: error.message 
    });
  }
});

// Document extraction endpoint
router.post('/extract-doc', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Received document:', req.file.originalname);

    textract.fromBufferWithMime(
      req.file.mimetype,
      req.file.buffer,
      { preserveLineBreaks: true },
      (error, text) => {
        if (error) {
          console.error('Document extraction error:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to extract text from document',
            details: error.message 
          });
        }
        res.json({ 
          success: true,
          text 
        });
      }
    );
  } catch (error) {
    console.error('Document extraction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to extract text from document',
      details: error.message 
    });
  }
});

module.exports = router; 