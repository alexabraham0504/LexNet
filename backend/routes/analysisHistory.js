const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Case = require('../models/caseModel');
const DocumentHistory = require('../models/DocumentHistory');

// Get analysis history for a specific case
router.get('/cases/:caseId/analysis-history', isAuthenticated, async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user._id;

    console.log('Fetching history for:', { caseId, userId });

    // Find the case and check if it belongs to the user
    const caseDoc = await Case.findOne({ 
      _id: caseId,
      clientId: userId 
    });

    console.log('Found case:', caseDoc);

    if (!caseDoc) {
      console.log('Case not found or unauthorized');
      return res.status(404).json({
        success: false,
        message: 'Case not found or unauthorized'
      });
    }

    // Get the analysis history
    const history = await DocumentHistory.findOne({
      caseId,
      userId
    });

    console.log('Found history:', history);

    // Return empty array if no history found
    if (!history) {
      console.log('No history found, returning empty array');
      return res.json({
        success: true,
        history: []
      });
    }

    // Sort analyses by date in descending order
    const sortedAnalyses = history.analyses.sort((a, b) => 
      new Date(b.dateAnalyzed) - new Date(a.dateAnalyzed)
    );

    console.log('Returning sorted analyses:', sortedAnalyses);

    res.json({
      success: true,
      history: sortedAnalyses
    });

  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis history',
      error: error.message
    });
  }
});

// Save analysis to history
router.post('/analysis-history', isAuthenticated, async (req, res) => {
  try {
    const { caseId, fileName, crime, sections, documentText } = req.body;
    const userId = req.user._id;

    console.log('Saving analysis:', {
      caseId,
      fileName,
      userId,
      sectionsCount: sections?.length
    });

    if (!caseId || !fileName || !crime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['caseId', 'fileName', 'crime'],
        received: { caseId, fileName, crime }
      });
    }

    // Find or create history document
    let history = await DocumentHistory.findOne({ caseId, userId });
    
    if (!history) {
      console.log('Creating new history document');
      history = new DocumentHistory({
        userId,
        caseId,
        analyses: []
      });
    }

    // Add new analysis
    const newAnalysis = {
      fileName,
      dateAnalyzed: new Date(),
      crime,
      sections,
      documentText
    };

    history.analyses.push(newAnalysis);
    await history.save();

    console.log('Saved analysis successfully');

    res.json({
      success: true,
      message: 'Analysis saved to history',
      analysis: newAnalysis
    });

  } catch (error) {
    console.error('Error saving analysis to history:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving analysis to history',
      error: error.message
    });
  }
});

// Delete history item
router.delete('/analysis-history/:historyId', isAuthenticated, async (req, res) => {
  try {
    const { historyId } = req.params;
    const userId = req.user._id;

    const history = await DocumentHistory.findOne({
      'analyses._id': historyId,
      userId
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found'
      });
    }

    // Remove the specific analysis
    history.analyses = history.analyses.filter(
      analysis => analysis._id.toString() !== historyId
    );

    await history.save();

    res.json({
      success: true,
      message: 'History item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting history item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting history item',
      error: error.message
    });
  }
});

// Add new route for restored cases
router.post('/analysis-history/restore', isAuthenticated, async (req, res) => {
  try {
    const { 
      caseId, 
      fileName, 
      crime, 
      sections, 
      documentText, 
      evidence,
      caseType,
      analysis,
      dateAnalyzed 
    } = req.body;
    const userId = req.user._id;

    // Validate the case exists and belongs to user
    const caseExists = await Case.findOne({ 
      _id: caseId,
      clientId: userId,
      isDeleted: false
    });

    if (!caseExists) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or unauthorized'
      });
    }

    // Find or create history document
    let history = await DocumentHistory.findOne({ caseId, userId });
    
    if (!history) {
      history = new DocumentHistory({
        userId,
        caseId,
        analyses: []
      });
    }

    // Create new analysis entry
    const newAnalysis = {
      fileName,
      dateAnalyzed: new Date(dateAnalyzed),
      crime,
      sections,
      documentText,
      evidence,
      caseType,
      analysis,
      restoredFrom: 'deleted_cases'
    };

    history.analyses.push(newAnalysis);
    await history.save();

    // Update case status
    await Case.findByIdAndUpdate(caseId, {
      $set: {
        isRestored: true,
        restoredAt: new Date(),
        lastAnalysisId: history._id
      }
    });

    res.json({
      success: true,
      message: 'Restored case added to analysis history',
      analysis: newAnalysis
    });

  } catch (error) {
    console.error('Error adding restored case to history:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding restored case to history',
      error: error.message
    });
  }
});

module.exports = router; 