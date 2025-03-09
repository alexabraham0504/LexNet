const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analyzeDocumentContent } = require('../utils/textAnalysis');

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

module.exports = {
  analyzeDocument
}; 