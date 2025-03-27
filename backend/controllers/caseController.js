const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analyzeDocumentContent } = require('../utils/textAnalysis');
const Assignment = require('../models/assignment');
const Case = require('../models/case');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeDocument = async (text, file, type, metadata) => {
  try {
    // Get analysis from Gemini
    const analysisText = await analyzeDocumentContent(text);

    // Parse the analysis text
    const crimeMatch = analysisText.match(/CRIME:\s*(.+?)(?=\n|$)/);
    const ipcMatch = analysisText.match(/IPC SECTIONS:\s*(.+?)(?=\n|$)/);
    const sectionDetailsMatch = analysisText.match(/SECTION DETAILS:\n([\s\S]+?)(?=\nEVIDENCE:|$)/);
    const evidenceMatch = analysisText.match(/EVIDENCE:\s*(.+?)(?=\n|$)/);

    // Structure the analysis results
    const analysisResult = {
      fileName: file.originalname,
      fileType: file.mimetype,
      primaryCrime: crimeMatch?.[1]?.trim() || 'Unknown Crime',
      ipcSections: ipcMatch?.[1]?.trim().split(',').map(s => s.trim()) || [],
      evidence: evidenceMatch?.[1]?.trim().split(';').map(e => e.trim()) || [],
      metadata: metadata,
      timestamp: new Date().toISOString()
    };

    // Parse section details
    if (sectionDetailsMatch && sectionDetailsMatch[1]) {
      const sections = [];
      const sectionTexts = sectionDetailsMatch[1].split(/\nSection /);
      sectionTexts.forEach(text => {
        if (text.trim()) {
          const [sectionNum, ...descParts] = text.split(':');
          sections.push({
            section: sectionNum.trim(),
            description: descParts.join(':').trim(),
            confidence: 0.9
          });
        }
      });
      analysisResult.sections = sections;
    }

    return analysisResult;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
};

exports.sendCaseToLawyer = async (req, res) => {
  try {
    const {
      caseId,
      lawyerId,
      clientId,
      clientNotes,
      caseDetails,
      payment
    } = req.body;

    // Validate required fields
    if (!caseId || !lawyerId || !clientId) {
      return res.status(400).json({
        success: false,
        message: "Missing required case assignment information"
      });
    }

    // Check if case already assigned to this lawyer
    const existingAssignment = await Assignment.findOne({
      caseId: caseId,
      lawyerId: lawyerId
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "This case is already assigned to the selected lawyer"
      });
    }

    // Create new assignment
    const newAssignment = new Assignment({
      caseId,
      lawyerId,
      clientId,
      clientNotes,
      caseDetails,
      // Include payment information if provided
      ...(payment && {
        payment: {
          paymentId: payment.paymentId,
          paymentRecordId: payment.paymentRecordId,
          amount: payment.amount,
          status: payment.status
        }
      }),
      status: 'pending',
      assignmentDate: new Date()
    });

    // Save assignment to database
    await newAssignment.save();

    // Update the case status to reflect it's been sent to a lawyer
    await Case.findByIdAndUpdate(caseId, {
      status: 'assigned',
      assignedLawyer: lawyerId
    });

    // Send notification to lawyer (implement as needed)
    // ...

    return res.status(201).json({
      success: true,
      message: "Case successfully sent to lawyer",
      assignment: newAssignment
    });
  } catch (error) {
    console.error("Error sending case to lawyer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send case to lawyer",
      error: error.message
    });
  }
};

module.exports = {
  analyzeDocument,
  sendCaseToLawyer
}; 