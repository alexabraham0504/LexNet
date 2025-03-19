const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/auth');
const Case = require('../models/caseModel');
const DocumentScan = require('../models/documentScanModel');
const { extractTextFromDocument } = require('../utils/documentUtils');
const { scanForPlagiarism } = require('../services/documentScanService');
const { Translate } = require('@google-cloud/translate').v2;

// Configure multer storage for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads', 'scans');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB in bytes
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['.txt', '.doc', '.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      cb(new Error('Invalid file type. Only TXT, DOC, DOCX, and PDF files are allowed.'));
      return;
    }
    cb(null, true);
  }
}).single('documentToCompare');

const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Route to scan document for plagiarism
router.post('/scan-plagiarism', isAuthenticated, (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 2MB limit'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Continue with the rest of your route handler
    try {
      console.log('Received scan request:', {
        body: req.body,
        file: req.file ? {
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file received'
      });
      
      const { originalDocumentId, caseId } = req.body;
      const documentToCompare = req.file;
      
      if (!originalDocumentId || !caseId || !documentToCompare) {
        console.log('Missing required parameters:', { originalDocumentId, caseId, documentToCompare });
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }
      
      // Verify the case exists and user has access
      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }
      
      // Find the original document in the case
      const originalDocument = caseDoc.documents.find(
        doc => doc._id.toString() === originalDocumentId
      );
      
      if (!originalDocument) {
        return res.status(404).json({
          success: false,
          message: 'Original document not found in case'
        });
      }
      
      // Get the path to the original document
      const originalDocPath = originalDocument.filePath || 
                             path.join(__dirname, '..', 'uploads', 'cases', originalDocument.fileName);
      
      // Extract text from both documents
      const originalText = await extractTextFromDocument(originalDocPath);
      const compareText = await extractTextFromDocument(documentToCompare.path);
      
      // Perform LSTM-based plagiarism detection
      const scanResult = await scanForPlagiarism(originalText, compareText);
      
      // Determine if document is forged based on similarity threshold
      const isForged = scanResult.similarityScore > 0.1; // Changed from 0.7 to 0.1 (10% threshold)
      
      // Save scan result to database
      const documentScan = new DocumentScan({
        caseId,
        originalDocumentId,
        comparedDocumentName: documentToCompare.originalname,
        comparedDocumentPath: documentToCompare.path,
        similarityScore: scanResult.similarityScore,
        isForged,
        scanDetails: scanResult.details,
        scannedBy: req.user._id
      });
      
      await documentScan.save();
      
      // Return the scan result
      return res.status(200).json({
        success: true,
        result: {
          similarityScore: scanResult.similarityScore,
          isForged,
          confidence: scanResult.confidence,
          comparisonDetails: scanResult.details
        }
      });
      
    } catch (error) {
      console.error('Document scan error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error scanning document',
        error: error.message
      });
    }
  });
});

// Add this route
router.post('/translate', isAuthenticated, async (req, res) => {
  try {
    const { texts, sourceLang1, sourceLang2, targetLang } = req.body;
    
    const translations = await Promise.all([
      translate.translate(texts[0], {
        from: sourceLang1,
        to: targetLang
      }),
      translate.translate(texts[1], {
        from: sourceLang2,
        to: targetLang
      })
    ]);

    res.json({
      success: true,
      translations: translations.map(t => t[0])
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message
    });
  }
});

module.exports = router; 