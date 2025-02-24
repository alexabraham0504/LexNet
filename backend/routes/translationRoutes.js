const express = require('express');
const router = express.Router();
const { processLegalDocument } = require('../services/translationService');
const { analyzeDocumentContent } = require('../utils/textAnalysis');

router.post('/process-document', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required',
        details: 'Document text cannot be empty'
      });
    }

    // Add input validation
    if (typeof text !== 'string' || text.length > 1000000) { // 1MB limit
      return res.status(400).json({
        error: 'Invalid input',
        details: 'Text must be a string under 1MB'
      });
    }

    const processedDoc = await processLegalDocument(text);
    
    if (!processedDoc || !processedDoc.englishText) {
      throw new Error('Document processing failed');
    }

    const analysis = await analyzeDocumentContent(processedDoc.englishText);

    res.json({
      originalLanguage: processedDoc.originalLanguage,
      englishText: processedDoc.englishText,
      analysis: analysis || processedDoc.analysis,
      success: true
    });

  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({
      error: 'Failed to process document',
      details: error.message,
      success: false,
      analysis: {
        section: null,
        description: '',
        confidence: 0,
        alternativeSections: [],
        keyTerms: [],
        legalScore: 0
      }
    });
  }
});

module.exports = router; 