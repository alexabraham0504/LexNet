const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Case = require("../models/caseModel");
const { isAuthenticated } = require("../middleware/auth");
const fs = require("fs");
const pdf = require('pdf-parse');
const textract = require('textract');
const fetch = require('node-fetch');
const Tesseract = require('tesseract.js');
const { 
  analyzeDocumentContent, 
  clusterSimilarCases, 
  calculateConfidenceScore,
  ipcPatterns
} = require('../utils/textAnalysis');
const { visionService } = require('../services/visionService');
const { bertService } = require('../services/bertService');
const LegalTextAnalyzer = require('../services/bertService');
const axios = require('axios');
const { getSpecializationFromAnalysis, getExactSpecialization } = require('../utils/specializations');
const Lawyer = require('../models/lawyerModel');
const AnalysisResult = require('../models/AnalysisResult');
const DocumentHistory = require('../models/DocumentHistory');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const os = require('os');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');

// Initialize Gemini with API key and version
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add the validation helper at the top
const LEGAL_KEYWORDS = [
  'section', 'act', 'court', 'judgment', 'petition', 'plaintiff', 'defendant',
  'prosecution', 'accused', 'witness', 'evidence', 'hearing', 'trial',
  'appeal', 'jurisdiction', 'law', 'legal', 'criminal', 'civil', 'judge',
  'magistrate', 'advocate', 'complaint', 'case', 'ipc', 'penal', 'code'
];

const validateLegalContent = (text) => {
  if (!text) return false;
  
  const words = text.toLowerCase().split(/\W+/);
  const uniqueWords = new Set(words);
  
  const legalTermCount = LEGAL_KEYWORDS.reduce((count, keyword) => {
    return uniqueWords.has(keyword) ? count + 1 : count;
  }, 0);
  
  return legalTermCount >= 3;
};

// Helper function to extract text from images
async function extractTextFromImage(buffer) {
  try {
    const worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(buffer);
    
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Image text extraction failed: ${error.message}`);
  }
}

// Helper function to extract text from documents
const extractTextFromDocument = async (file) => {
  try {
    let extractedText = '';
    
    if (file.mimetype === 'application/pdf') {
      // Handle PDF files
      const pdfData = await pdf(file.buffer);
      extractedText = pdfData.text;
      
      console.log('\nExtracted text from PDF:');
      console.log('----------------------------------------');
      console.log(extractedText.substring(0, 200) + '...');
      console.log('----------------------------------------');
    } 
    else if (file.mimetype.includes('text') || file.mimetype.includes('document')) {
      // Handle text and doc files
      extractedText = await new Promise((resolve, reject) => {
        textract.fromBufferWithMime(
          file.mimetype,
          file.buffer,
          { preserveLineBreaks: true },
          (error, text) => {
            if (error) reject(error);
            else resolve(text);
          }
        );
      });
    }
    else if (file.mimetype.includes('image')) {
      try {
        // Use Tesseract directly with the buffer
        extractedText = await extractTextFromImage(file.buffer);
        
        // Fallback to Google Vision API if Tesseract fails or returns no text
        if (!extractedText || extractedText.trim().length === 0) {
          console.log('Tesseract extraction failed, trying Google Vision API...');
          const base64Image = file.buffer.toString('base64');
          
          const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
            {
              requests: [{
                image: { content: base64Image },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
              }]
            }
          );
          
          extractedText = response.data.responses[0]?.fullTextAnnotation?.text || '';
        }
      } catch (error) {
        console.error('Image processing error:', error);
        throw new Error(`Failed to extract text from image: ${error.message}`);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    return extractedText;
  } catch (error) {
    console.error('Error in extractTextFromDocument:', error);
    throw error;
  }
};

// Move these functions to the top level of the file
const calculateSectionConfidence = (section, documentText) => {
  let score = 0.5; // Base score
  const matchFactors = [];

  // Check for exact section number match
  if (documentText.includes(`Section ${section.section}`)) {
    score += 0.3;
    matchFactors.push('Direct section match');
  }

  // Check for key legal terms in the section description
  const legalTerms = ['punishment', 'penalty', 'imprisonment', 'fine', 'offense'];
  const matchedTerms = legalTerms.filter(term => 
    section.description.toLowerCase().includes(term)
  );
  score += (matchedTerms.length / legalTerms.length) * 0.2;
  
  if (matchedTerms.length > 0) {
    matchFactors.push(`Legal terms match (${matchedTerms.length} terms)`);
  }

  return {
    confidence: Math.min(Math.max(score, 0.1), 1),
    matchFactors
  };
};

const processSearchResults = async (documentText, searchResults) => {
  if (!searchResults?.webPages?.value) {
    return [];
  }

  const sections = searchResults.webPages.value
    .map(page => {
      const sectionMatch = page.snippet.match(/Section\s+(\d+[A-Z]?)/i);
      if (sectionMatch) {
        const confidenceData = calculateSectionConfidence(
          { section: sectionMatch[1], description: page.snippet },
          documentText
        );
        return {
          section: sectionMatch[1],
          description: page.snippet,
          confidence: confidenceData.confidence,
          matchFactors: confidenceData.matchFactors,
          source: page.url
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  return sections;
};

// Update the POST route to handle both file uploads and JSON data
router.post("/", isAuthenticated, async (req, res) => {
  try {
    // Configure multer for this specific route
    const upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = 'uploads';
          if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, uniqueSuffix + path.extname(file.originalname));
        }
      }),
      fileFilter: (req, file, cb) => {
        // Accept PDF, DOC, DOCX, and common image formats
        const allowedTypes = ['application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg', 'image/png'];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'));
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
      }
    }).array('documents', 10); // Changed from array to single

    // Handle file upload with async/await
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            reject({
              status: 400,
              message: err.code === 'LIMIT_FILE_SIZE' 
                ? 'File size exceeds the 50MB limit'
                : err.message
            });
          } else {
            reject({
              status: 500,
              message: err.message || 'Unknown file upload error'
            });
          }
        }
        resolve();
      });
    });

    // Rest of your existing code...
    console.log('Received files:', req.files?.length);
    console.log('Received case type:', req.body.caseType);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files were uploaded"
      });
    }

    const invalidDocuments = [];
    const validDocuments = [];
    
    // Process each document
    for (const file of req.files) {
      try {
        const extractedText = await extractTextFromDocument(file);
        
        // Validate content
        if (!validateLegalContent(extractedText)) {
          invalidDocuments.push(`${file.originalname} (no legal content detected)`);
          // Delete invalid file
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Error deleting invalid file ${file.path}:`, err);
          });
          continue;
        }
        
        validDocuments.push({
          fileName: file.originalname,
          filePath: file.path,
          fileType: path.extname(file.originalname).toLowerCase().substring(1),
          extractedText,
          size: file.size
        });
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        invalidDocuments.push(`${file.originalname} (processing error)`);
        
        // Clean up the failed file
        fs.unlink(file.path, (err) => {
          if (err) console.error(`Error deleting failed file ${file.path}:`, err);
        });
      }
    }

    if (validDocuments.length === 0) {
      return res.status(400).json({
        message: "No valid legal documents found",
        invalidDocuments
      });
    }

    // Combine text from valid documents for IPC analysis
    const combinedText = validDocuments.map(doc => doc.extractedText).join('\n\n');
    
    // Analyze each document separately
    const documentAnalyses = await Promise.all(validDocuments.map(async (doc) => {
      try {
        // Extract key crime-related phrases from the document
        const crimeKeywords = extractCrimeKeywords(doc.extractedText);
        
        // Create a more specific search query based on crime keywords
        const searchQuery = `Indian Penal Code section for ${crimeKeywords.join(' ')}`;
        
        console.log('Document analysis for:', doc.fileName);
        console.log('Search query:', searchQuery);

        const response = await fetch(
          `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchQuery)}`,
          {
            method: "GET",
            headers: {
              "Ocp-Apim-Subscription-Key": "21f82301b9544a57bd153b1b4d7f3a03",
            },
          }
        );

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        if (!data.webPages?.value) {
          console.log('No web pages found in API response');
          return null;
        }

        // Process search results to find relevant IPC sections
        const sections = await processIPCSections(data.webPages.value, doc.extractedText);
        
        if (!sections || sections.length === 0) {
          console.log('No valid sections found for document:', doc.fileName);
          return null;
        }

        return {
          fileName: doc.fileName,
          sections: sections
        };
      } catch (error) {
        console.error('Error analyzing document:', doc.fileName, error);
        return null;
      }
    }));

    // Filter out null results and combine analyses
    const validAnalyses = documentAnalyses.filter(Boolean);
    
    // Combine and deduplicate sections based on confidence
    const sectionMap = new Map();
    
    validAnalyses.forEach(analysis => {
      if (!analysis.sections || analysis.sections.length === 0) return;
      
      // Add primary section
      const primary = analysis.sections[0];
      if (primary && primary.section && (!sectionMap.has(primary.section) || 
          sectionMap.get(primary.section).confidence < primary.confidence)) {
        sectionMap.set(primary.section, primary);
      }
      
      // Add related sections
      if (analysis.sections.length > 1) {
        analysis.sections.slice(1).forEach(related => {
          if (related && related.section && (!sectionMap.has(related.section) || 
              sectionMap.get(related.section).confidence < related.confidence)) {
            sectionMap.set(related.section, related);
          }
        });
      }
    });

    // Convert map to arrays and sort by confidence
    const allSections = Array.from(sectionMap.values())
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence);

    // Create new case with the combined analysis
    const newCase = new Case({
      clientId: req.user._id,
      title: `Case Analysis ${new Date().toLocaleDateString()}`,
      description: `Document analysis performed on ${validDocuments.length} files`,
      documents: validDocuments,
      caseType: req.body.caseType || 'other',
      status: 'pending',
      ipcSection: allSections[0]?.section || null,
      ipcDescription: allSections[0]?.description || null,
      relatedSections: allSections.slice(1).map(section => ({
        section: section.section,
        confidence: section.confidence,
        description: section.description
      })) || [],
      evidenceContext: extractEvidenceContext(combinedText)
    });

    await newCase.save();

    res.status(200).json({
      validAnalysis: true,
      message: "Case created successfully",
      invalidDocuments,
      caseId: newCase._id,
      ipcAnalysis: {
        section: allSections[0]?.section,
        description: allSections[0]?.description,
        relatedSections: allSections.slice(1)
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// List routes first
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    console.log('Fetching cases for user:', req.user._id);
    
    const cases = await Case.find({ 
      clientId: req.user._id,
      isDeleted: false 
    })
    .sort({ createdAt: -1 });

    console.log(`Found ${cases.length} cases`);
    res.json({
      success: true,
      cases: cases
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cases',
      error: error.message 
    });
  }
});

// Get deleted cases
router.get("/deleted", isAuthenticated, async (req, res) => {
  try {
    const deletedCases = await Case.find({
      clientId: req.user._id,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    res.json(deletedCases);
  } catch (error) {
    console.error("Error fetching deleted cases:", error);
    res.status(500).json({ 
      message: "Error fetching deleted cases",
      error: error.message 
    });
  }
});

// Then parameter routes
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching case with ID:', id);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid case ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    const caseDetails = await Case.findOne({ 
      _id: id,
      isDeleted: false,
      clientId: req.user._id
    })
    .populate('clientId', 'name email')
    .populate('assignedLawyers', 'fullName email specialization');

    if (!caseDetails) {
      console.log('Case not found or access denied for ID:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Case not found or access denied' 
      });
    }

    console.log('Case found:', caseDetails._id);
    res.json({
      success: true,
      case: caseDetails
    });
  } catch (error) {
    console.error('Error fetching case details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching case details',
      error: error.message 
    });
  }
});

// Get summary
router.get("/summary", isAuthenticated, async (req, res) => {
  try {
    const cases = await Case.find({ 
      clientId: req.user._id,
      isDeleted: false 
    })
    .select('title status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json(cases);
  } catch (error) {
    console.error("Error fetching case summaries:", error);
    res.status(500).json({ 
      message: "Error fetching cases",
      error: error.message 
    });
  }
});

// Update the permanent delete route
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const caseItem = await Case.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });

    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Delete associated documents if they exist
    if (caseItem.documents && caseItem.documents.length > 0) {
      caseItem.documents.forEach(doc => {
        if (doc.filePath) {
          const filePath = path.join(__dirname, '..', '..', doc.filePath);
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting file ${filePath}:`, err);
          });
        }
      });
    }

    // Permanently delete the case
    await Case.deleteOne({ _id: caseItem._id });
    res.json({ success: true, message: "Case permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting case:", error);
    res.status(500).json({ message: "Error permanently deleting case" });
  }
});

// Add this route to update existing cases
router.post("/migrate-case-types", isAuthenticated, async (req, res) => {
  try {
    const result = await Case.updateMany(
      { caseType: { $exists: false } },
      { $set: { caseType: 'other' } }
    );
    
    res.json({
      message: "Migration completed",
      updated: result.nModified
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ 
      message: "Error migrating cases",
      error: error.message 
    });
  }
});

// Soft delete a case
router.put("/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const caseItem = await Case.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });

    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }

    caseItem.isDeleted = true;
    caseItem.deletedAt = new Date();
    await caseItem.save();

    res.json({ success: true, message: "Case moved to trash" });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({ message: "Error deleting case" });
  }
});

// Restore a deleted case
router.put("/:id/restore", isAuthenticated, async (req, res) => {
  try {
    const caseItem = await Case.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });

    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }

    caseItem.isDeleted = false;
    caseItem.deletedAt = null;
    await caseItem.save();

    res.json({ success: true, message: "Case restored successfully" });
  } catch (error) {
    console.error("Error restoring case:", error);
    res.status(500).json({ message: "Error restoring case" });
  }
});

// Helper function to extract evidence context
function extractEvidenceContext(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const evidenceKeywords = ['evidence', 'witness', 'statement', 'testimony', 'exhibit', 'document', 'proof'];
  
  return sentences
    .filter(sentence => 
      evidenceKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    )
    .slice(0, 5); // Return top 5 evidence-related sentences
}

// Add this route to update IPC information
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { ipcSection, ipcDescription, relatedSections } = req.body;
    
    const updatedCase = await Case.findOneAndUpdate(
      {
        _id: req.params.id,
        clientId: req.user._id
      },
      {
        $set: {
          ipcSection,
          ipcDescription,
          relatedSections,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    res.status(500).json({ 
      message: "Error updating case",
      error: error.message 
    });
  }
});

// Helper function to extract crime-related keywords
function extractCrimeKeywords(text) {
  const crimePatterns = [
    /(?:murder|kill|death|homicide)/i,
    /(?:theft|steal|robbery|burglary)/i,
    /(?:assault|attack|hurt|injury)/i,
    /(?:fraud|cheat|deceive|misrepresentation)/i,
    /(?:rape|sexual|molestation)/i,
    /(?:kidnap|abduct|hostage)/i,
    /(?:threat|criminal intimidation|coercion)/i,
    /(?:forgery|counterfeit|fake)/i,
    /(?:conspiracy|criminal act|illegal)/i,
    /(?:damage|mischief|vandalism)/i
  ];

  const keywords = new Set();
  crimePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.add(matches[0].toLowerCase());
    }
  });

  return Array.from(keywords);
}

// Helper function to search IPC sections
async function searchIPCSections(keywords) {
  try {
    // Create a more specific search query
    const searchQuery = `Indian Penal Code section for ${keywords.join(' ')}`;
    console.log('Search query:', searchQuery);

    const response = await axios.get(
      'https://api.bing.microsoft.com/v7.0/search',
      {
        params: {
          q: searchQuery,
          count: 10,
          responseFilter: 'Webpages',
          freshness: 'Month'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': '21f82301b9544a57bd153b1b4d7f3a03'
        }
      }
    );

    const results = response.data.webPages.value;
    const sections = [];
    const processedSections = new Set();

    for (const result of results) {
      // Look for IPC section mentions in title and snippet
      const sectionMatches = (result.title + ' ' + result.snippet)
        .match(/(?:Section|Sec\.|S\.) (\d+[A-Za-z]?)(?:\s+(?:of|IPC|Indian Penal Code))?/gi);

      if (sectionMatches) {
        for (const match of sectionMatches) {
          const sectionNumber = match.match(/\d+[A-Za-z]?/)[0];
          
          // Avoid duplicate sections
          if (!processedSections.has(sectionNumber)) {
            processedSections.add(sectionNumber);
            
            // Calculate confidence based on position and context
            const confidence = calculateConfidence(result.snippet, keywords);

            sections.push({
              number: sectionNumber,
              description: cleanDescription(result.snippet),
              confidence,
              url: result.url,
              source: 'IPC'
            });
          }
        }
      }
    }

    // Sort by confidence
    return sections.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error searching IPC sections:', error);
    return [];
  }
}

// Helper function to calculate confidence score
function calculateConfidence(text, keywords) {
  let score = 0;
  
  // Check keyword presence
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      score += 0.2;
    }
  });

  // Check for legal context
  if (text.match(/(?:punishment|penalty|imprisonment|fine)/i)) {
    score += 0.2;
  }

  // Check for section description
  if (text.match(/(?:whoever|shall be|punishable|commits)/i)) {
    score += 0.2;
  }

  // Normalize score between 0 and 1
  return Math.min(Math.max(score, 0.1), 1);
}

// Helper function to clean section descriptions
function cleanDescription(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,()-]/g, '')
    .trim();
}

// Function to get IPC section details
async function getIPCSection(searchText) {
  try {
    const searchQuery = `Indian Penal Code Section explanation ${searchText}`;
    const response = await axios.get(
      'https://api.bing.microsoft.com/v7.0/search',
      {
        params: {
          q: searchQuery,
          count: 5,
          textDecorations: true,
          textFormat: 'HTML'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': '21f82301b9544a57bd153b1b4d7f3a03'
        }
      }
    );

    const webPages = response.data.webPages?.value || [];
    const sections = new Set();
    const results = [];

    for (const page of webPages) {
      const sectionMatches = page.snippet.match(/Section\s+(\d+[A-Za-z]?)/gi);
      
      if (sectionMatches) {
        for (const match of sectionMatches) {
          const section = match.match(/\d+[A-Za-z]?/)[0];
          if (!sections.has(section)) {
            sections.add(section);
            results.push({
              section: section,
              description: page.snippet,
              confidence: calculateRelevance(page.snippet, searchText),
              url: page.url
            });
          }
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  } catch (error) {
    console.error('Error fetching IPC sections:', error);
    return [];
  }
}

// Calculate relevance score
function calculateRelevance(description, searchText) {
  let score = 0.5; // Base score

  // Check for key legal terms
  const legalTerms = [
    'punishment', 'penalty', 'imprisonment', 'fine',
    'whoever', 'shall be', 'liable', 'offence',
    'criminal', 'intent', 'act', 'law'
  ];

  legalTerms.forEach(term => {
    if (description.toLowerCase().includes(term.toLowerCase())) {
      score += 0.1;
    }
  });

  // Check if description contains search terms
  const searchTerms = searchText.toLowerCase().split(' ');
  searchTerms.forEach(term => {
    if (description.toLowerCase().includes(term)) {
      score += 0.1;
    }
  });

  return Math.min(score, 1); // Cap at 1.0
}

// Function to analyze case content using BERT
async function analyzeCaseContent(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for analysis');
    }

    // Extract key information using BERT
    const bertAnalysis = await bertService.analyzeText(text);
    
    if (!bertAnalysis) {
      throw new Error('BERT analysis failed to return results');
    }

    // Ensure categories exist
    const categories = bertAnalysis.categories || [];
    
    // Extract crime-related keywords
    const crimeKeywords = extractCrimeKeywords(text);
    
    // Combine BERT analysis with crime keywords
    const keyFindings = {
      categories: categories,
      crimeKeywords: crimeKeywords || [],
      mainCrimeType: identifyCrimeType(crimeKeywords || [], categories)
    };

    return keyFindings;
  } catch (error) {
    console.error('Error analyzing case content:', error);
    return {
      categories: [],
      crimeKeywords: [],
      mainCrimeType: 'UNKNOWN'
    };
  }
}

// Function to identify crime type
function identifyCrimeType(keywords = [], categories = []) {
  const crimeTypes = {
    VIOLENT: ['murder', 'assault', 'rape', 'kidnap', 'hurt', 'injury', 'death'],
    PROPERTY: ['theft', 'robbery', 'burglary', 'damage', 'mischief'],
    FINANCIAL: ['fraud', 'cheating', 'forgery', 'corruption'],
    CYBERCRIME: ['hacking', 'cybercrime', 'online', 'digital'],
    OTHER: []
  };

  try {
    let scores = Object.keys(crimeTypes).map(type => ({
      type,
      score: crimeTypes[type].filter(term => 
        keywords.some(k => k && k.toLowerCase().includes(term))
      ).length
    }));

    // Add weight from BERT categories
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        if (cat && cat.category) {
          Object.keys(crimeTypes).forEach(type => {
            if (cat.category.toLowerCase().includes(type.toLowerCase())) {
              const score = scores.find(s => s.type === type);
              if (score) {
                score.score += (cat.confidence || 0);
              }
            }
          });
        }
      });
    }

    const topCrime = scores.reduce((max, curr) => 
      curr.score > max.score ? curr : max,
      { type: 'UNKNOWN', score: 0 }
    );

    return topCrime.score > 0 ? topCrime.type : 'UNKNOWN';
  } catch (error) {
    console.error('Error in crime type identification:', error);
    return 'UNKNOWN';
  }
}

// Function to get relevant IPC sections based on analysis
async function getRelevantIPCSections(analysis) {
  try {
    if (!analysis || !analysis.mainCrimeType) {
      throw new Error('Invalid analysis input');
    }

    const keywords = analysis.crimeKeywords || [];
    const categories = analysis.categories || [];
    
    // Construct search query using analysis results
    const searchQuery = `Indian Penal Code sections for ${analysis.mainCrimeType} ${keywords.join(' ')} ${categories.map(c => c?.category || '').join(' ')}`.trim();
    
    if (!searchQuery) {
      throw new Error('Empty search query generated');
    }

    const response = await axios.get(
      'https://api.bing.microsoft.com/v7.0/search',
      {
        params: {
          q: searchQuery,
          count: 10,
          textDecorations: true,
          textFormat: 'HTML'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
        }
      }
    );

    const webPages = response.data.webPages?.value || [];
    const sections = new Set();
    const results = [];

    for (const page of webPages) {
      if (!page || !page.snippet) continue;

      const sectionMatches = page.snippet.match(/Section\s+(\d+[A-Za-z]?)/gi);
      
      if (sectionMatches) {
        for (const match of sectionMatches) {
          const sectionNumber = match.match(/\d+[A-Za-z]?/);
          if (sectionNumber && !sections.has(sectionNumber[0])) {
            sections.add(sectionNumber[0]);
            const confidence = calculateRelevance(
              page.snippet, 
              keywords.join(' '),
              analysis.mainCrimeType
            );
            
            if (confidence > 0.5) {
              results.push({
                section: sectionNumber[0],
                description: page.snippet,
                confidence,
                url: page.url
              });
            }
          }
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  } catch (error) {
    console.error('Error fetching IPC sections:', error);
    return [];
  }
}

// Add this helper function at the top of the file
const getIPCSectionsFromKeywords = (text) => {
  // Define keyword mappings to IPC sections
  const keywordMappings = {
    // Environmental violations
    'garbage': ['268', '269', '278', '290'],
    'waste': ['268', '269', '278', '290'],
    'pollution': ['268', '269', '278', '290'],
    'dumping': ['268', '269', '278', '290'],
    'nuisance': ['268', '290'],
    'health hazard': ['269', '278'],
    'public health': ['269', '278'],
    
    // Property crimes
    'theft': ['378', '379'],
    'stolen': ['378', '379', '411'],
    'robbery': ['390', '392'],
    'burglary': ['445', '446', '454', '457'],
    'trespass': ['441', '447'],
    'damage': ['425', '426', '427'],
    'property': ['425', '426', '427', '447'],
    
    // Violent crimes
    'murder': ['302', '304'],
    'kill': ['302', '304', '307'],
    'death': ['302', '304', '304A'],
    'hurt': ['319', '320', '323', '324', '325'],
    'injury': ['319', '320', '323', '324', '325'],
    'assault': ['351', '352', '353'],
    'attack': ['351', '352', '353'],
    
    // Fraud and cheating
    'fraud': ['415', '420'],
    'cheat': ['415', '420'],
    'deceive': ['415', '420'],
    'forgery': ['463', '465', '468'],
    'fake': ['463', '465', '468', '471'],
    
    // Defamation
    'defamation': ['499', '500'],
    'slander': ['499', '500'],
    'libel': ['499', '500'],
    'reputation': ['499', '500'],
    
    // Harassment and cruelty
    'harassment': ['354A', '354D', '498A'],
    'stalk': ['354D'],
    'dowry': ['498A', '304B'],
    'cruelty': ['498A'],
    
    // Cybercrime
    'hacking': ['66', '66C', '66D', '66F'], // IT Act sections
    'cyber': ['66', '66C', '66D', '66F'],
    'online': ['66', '66C', '66D', '66F'],
    'computer': ['66', '66C', '66D', '66F'],
    
    // Specific document types
    'fir': [], // Just a document type, not tied to specific sections
    'complaint': [], // Just a document type, not tied to specific sections
    'police report': [] // Just a document type, not tied to specific sections
  };
  
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Find matching keywords and collect IPC sections
  const matchedSections = new Set();
  
  Object.entries(keywordMappings).forEach(([keyword, sections]) => {
    if (lowerText.includes(keyword)) {
      sections.forEach(section => matchedSections.add(section));
    }
  });
  
  return Array.from(matchedSections);
};

// Update the analyze-direct route to use keyword matching
router.post("/analyze-direct", isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Extract text from the uploaded file
    let extractedText = '';
    try {
      extractedText = await extractTextFromDocument(req.file);
      console.log('Text extracted successfully, length:', extractedText.length);
      
      // Log a sample of the text to verify content
      console.log('Text sample:', extractedText.substring(0, 300));
      
      if (extractedText.length < 50) {
        return res.status(422).json({
          success: false,
          message: 'Extracted text is too short for meaningful analysis'
        });
      }
    } catch (extractError) {
      return res.status(422).json({
        success: false,
        message: `Text extraction failed: ${extractError.message}`
      });
    }

    try {
      // Use the Node.js client library directly
      const apiKey = process.env.GEMINI_API_KEY;
      console.log("Using API key (first 5 chars):", apiKey ? apiKey.substring(0, 5) + "..." : "No key found");
      
      // Create a new instance of the API
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Try with the gemini-1.5-flash model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      });
      
      // Get the prompt from the request if available
      const customPrompt = req.body.prompt || "";
      
      // Find potential IPC sections based on keywords
      const keywordBasedSections = getIPCSectionsFromKeywords(extractedText);
      console.log("Keyword-based IPC sections:", keywordBasedSections);
      
      // Create a more explicit prompt that includes the document text and suggested IPC sections
      const prompt = `${customPrompt || "Analyze this legal document and provide:"} 

The document text is as follows:
"""
${extractedText}
"""

Based on the above document, please identify:
1) The primary crime or offense described (if any)
2) Relevant IPC sections that apply to this case
3) Key evidence mentioned in the document

Based on keywords in the document, these IPC sections might be relevant: ${keywordBasedSections.join(', ')}

Format your response as follows:
CRIME IDENTIFIED: [primary crime or offense]

IPC SECTIONS: [relevant sections with brief descriptions, e.g., 268 (Public Nuisance), 269 (Negligent act likely to spread infection)]

EVIDENCE:
- [evidence point 1]
- [evidence point 2]
- [evidence point 3]

ANALYSIS CONFIDENCE: [High/Medium/Low]

RECOMMENDATIONS: [Any recommendations]`;
      
      console.log("Sending prompt to Gemini...");
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log("Received analysis from Gemini, length:", analysisText.length);
      console.log("Analysis sample:", analysisText.substring(0, 200));
      
      // Parse the analysis to extract structured information
      const crimeMatch = analysisText.match(/CRIME(?:\sIDENTIFIED)?:\s*([\s\S]*?)(?=\n\n|\nIPC|$)/i);
      const ipcMatch = analysisText.match(/IPC\sSECTIONS:\s*([\s\S]*?)(?=\n\n|\nEVIDENCE|$)/i);
      const evidenceMatch = analysisText.match(/EVIDENCE:(?:\n|)([\s\S]*?)(?=\n\n|\nANALYSIS|$)/i);
      const confidenceMatch = analysisText.match(/ANALYSIS\sCONFIDENCE:\s*([\s\S]*?)(?=\n\n|\nRECOMMENDATIONS|$)/i);
      const recommendationsMatch = analysisText.match(/RECOMMENDATIONS:\s*([\s\S]*?)(?=\n\n|$)/i);
      
      // If no IPC sections were found in the analysis, use the keyword-based ones
      let ipcSections = [];
      if (ipcMatch && ipcMatch[1]) {
        ipcSections = ipcMatch[1].trim().split(',').map(s => s.trim());
      } else if (keywordBasedSections.length > 0) {
        ipcSections = keywordBasedSections;
      }
      
      // Create a structured result with default values if needed
      const parsedAnalysis = {
        crimeIdentified: crimeMatch?.[1]?.trim() || 'Unable to determine from provided text',
        ipcSections: ipcSections.length > 0 ? ipcSections : ['Unable to determine'],
        evidence: evidenceMatch?.[1]
          ? evidenceMatch[1].split('\n')
              .map(line => line.trim())
              .filter(line => line.startsWith('-') || line.startsWith('•'))
              .map(line => line.replace(/^[-•]\s*/, ''))
          : ['Unable to extract clear evidence points'],
        confidence: confidenceMatch?.[1]?.trim() || 'Low',
        recommendations: recommendationsMatch?.[1]?.trim() || 'Consider consulting with a legal expert for more accurate analysis'
      };
      
      const analysisResult = {
        success: true,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        analysis: {
          rawAnalysis: analysisText,
          originalText: extractedText.substring(0, 1000) + "..." // Truncate for response size
        },
        parsedAnalysis: parsedAnalysis
      };

      res.json(analysisResult);

    } catch (analysisError) {
      console.error('Analysis error details:', analysisError);
      
      // Get keyword-based sections as fallback
      const keywordBasedSections = getIPCSectionsFromKeywords(extractedText);
      
      // Determine crime type based on keywords
      let crimeType = 'Unknown';
      if (extractedText.toLowerCase().includes('garbage') || 
          extractedText.toLowerCase().includes('waste') ||
          extractedText.toLowerCase().includes('pollution')) {
        crimeType = "Public Nuisance/Environmental Violation";
      } else if (extractedText.toLowerCase().includes('theft') || 
                extractedText.toLowerCase().includes('stolen') ||
                extractedText.toLowerCase().includes('robbery')) {
        crimeType = "Theft/Property Crime";
      } else if (extractedText.toLowerCase().includes('hurt') || 
                extractedText.toLowerCase().includes('injury') ||
                extractedText.toLowerCase().includes('assault')) {
        crimeType = "Assault/Hurt";
      }
      
      // Provide a fallback analysis based on keywords
      return res.status(206).json({
        success: true,
        partial: true,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        analysis: {
          rawAnalysis: "Fallback analysis provided based on document keywords",
          originalText: extractedText.substring(0, 1000) + "..."
        },
        parsedAnalysis: {
          crimeIdentified: crimeType,
          ipcSections: keywordBasedSections.length > 0 ? keywordBasedSections : ["Unable to determine"],
          evidence: ["Document contains keywords related to the identified crime"],
          confidence: "Low (Keyword-Based Analysis)",
          recommendations: "This is a basic keyword-based analysis. Please consult a legal expert for accurate interpretation."
        }
      });
    }
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Update the suggest-lawyers endpoint
router.get("/suggest-lawyers/:sectionNumber", async (req, res) => {
  try {
    const { sectionNumber } = req.params;

    // Get specialization based on IPC section
    const specializationInfo = getExactSpecialization(sectionNumber);
    console.log('Specialization Info:', specializationInfo);

    // Find lawyers with matching specialization
    const query = {
      $and: [
        {
          // Match exact specialization (e.g., "Criminal Law")
          specialization: specializationInfo.specialization
        },
        { isVerified: true },
        { visibleToClients: true },
        { status: 'active' }
      ]
    };

    const suggestedLawyers = await Lawyer.find(query)
      .select('fullName email phone specialization fees location rating expertise yearsOfExperience consultationFees')
      .lean();

    // Sort lawyers by relevance
    const sortedLawyers = suggestedLawyers.sort((a, b) => {
      const getRelevanceScore = (lawyer) => {
        let score = 0;
        
        // Exact specialization match
        if (lawyer.specialization === specializationInfo.specialization) {
          score += 5;
        }

        // Expertise in specific crime type
        if (lawyer.expertise?.includes(specializationInfo.subType)) {
          score += 3;
        }

        // Experience and rating bonuses
        score += Math.min(lawyer.yearsOfExperience || 0, 10) / 2;
        score += (lawyer.rating || 0);
        
        return score;
      };

      return getRelevanceScore(b) - getRelevanceScore(a);
    });

    res.json({
      specialization: specializationInfo.specialization,
      subType: specializationInfo.subType,
      lawyers: sortedLawyers,
      matchInfo: specializationInfo
    });

  } catch (error) {
    console.error("Error suggesting lawyers:", error);
    res.status(500).json({ message: "Error fetching lawyer suggestions" });
  }
});

// Add this route to store analysis results
router.post("/store-analysis", async (req, res) => {
  try {
    const { userId, fileName, crime, sections, severity, category, documentText } = req.body;
    
    const newAnalysis = new AnalysisResult({
      userId,
      fileName,
      crime,
      sections,
      severity,
      category,
      documentText,
      confidence: calculateConfidenceScore(documentText)
    });

    await newAnalysis.save();
    
    res.json({
      success: true,
      analysis: newAnalysis
    });
  } catch (error) {
    console.error("Error storing analysis:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add this route to get analysis history
router.get("/analysis-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const analysisHistory = await AnalysisResult.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      history: analysisHistory
    });
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add analysis to case history
router.post("/cases/:caseId/analysis", async (req, res) => {
  try {
    const { caseId } = req.params;
    const analysisData = req.body;

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        $push: { 
          analysisHistory: {
            $each: [analysisData],
            $position: 0  // Add new analysis at the beginning
          }
        }
      },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json({
      success: true,
      analysisHistory: updatedCase.analysisHistory
    });
  } catch (error) {
    console.error("Error adding analysis:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get case analysis history
router.get("/cases/:caseId/analysis-history", async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('Fetching history for case:', caseId);
    
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ 
        success: false,
        message: "Case not found" 
      });
    }

    console.log('Found case history:', caseData.analysisHistory);

    res.json({
      success: true,
      analysisHistory: caseData.analysisHistory || []
    });

  } catch (error) {
    console.error("Error fetching analysis history:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Store analysis result in history
router.post("/cases/:caseId/analysis-history", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { analysisData } = req.body;

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        $push: { 
          analysisHistory: {
            $each: [analysisData],
            $position: 0  // Add new analysis at the beginning
          }
        }
      },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ 
        success: false, 
        message: "Case not found" 
      });
    }

    res.json({
      success: true,
      analysisHistory: updatedCase.analysisHistory
    });

  } catch (error) {
    console.error("Error storing analysis:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get analysis history for a case
router.get("/cases/:caseId/analysis-history", async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.query.userId;

    const history = await DocumentHistory.findOne({ 
      caseId: caseId,
      userId: userId 
    }).sort({ 'analyses.dateAnalyzed': -1 });

    if (!history) {
      return res.json({
        success: true,
        history: [] // Return empty array if no history found
      });
    }

    res.json({
      success: true,
      history: history.analyses
    });
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get cases by client ID with analysis results
router.get("/client/:clientId", isAuthenticated, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    
    // Fetch cases with populated analysis results
    const cases = await Case.find({
      clientId: clientId,
      isDeleted: false
    })
    .populate('lastAnalysisId')
    .sort({ createdAt: -1 });

    // Fetch analysis results for each case
    const casesWithAnalysis = await Promise.all(cases.map(async (caseItem) => {
      const analysisResults = await AnalysisResult.find({
        userId: clientId,
        fileName: { $in: caseItem.documents.map(doc => doc.fileName) }
      }).sort({ createdAt: -1 });

      return {
        ...caseItem.toObject(),
        analysisResults: analysisResults
      };
    }));

    res.json({
      success: true,
      cases: casesWithAnalysis
    });
  } catch (error) {
    console.error("Error fetching client cases:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching cases",
      error: error.message 
    });
  }
});

// Add this near the top of your routes, before other GET routes
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Fetching all cases for user:', req.user._id);
    
    const cases = await Case.find({ 
      clientId: req.user._id,
      isDeleted: false 
    })
    .sort({ createdAt: -1 });

    console.log(`Found ${cases.length} cases`);
    res.json({
      success: true,
      cases: cases
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cases',
      error: error.message 
    });
  }
});

// Add this route to save analysis results
router.post('/save-analysis', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // Get from auth middleware
    const caseData = req.body;

    // Ensure we have a clientId
    if (!caseData.clientId && !userId) {
      throw new Error('User ID is required');
    }

    // Create new Case document
    const newCase = new Case({
      clientId: userId || caseData.clientId, // Use authenticated user ID or provided clientId
      ...caseData
    });

    // Save the case
    const savedCase = await newCase.save();

    // Create AnalysisResult document
    const analysisResult = new AnalysisResult({
      userId: userId || caseData.clientId,
      fileName: caseData.documents[0].fileName,
      crime: caseData.analysisResults.parsedAnalysis.crimeIdentified,
      sections: caseData.analysisResults.parsedAnalysis.ipcSections.map(section => ({
        number: section.number,
        description: section.description
      })),
      severity: 'Medium',
      category: caseData.caseType,
      documentText: caseData.documents[0].extractedText,
      confidence: caseData.analysisResults.parsedAnalysis.confidence === 'High' ? 0.9 : 
                 caseData.analysisResults.parsedAnalysis.confidence === 'Medium' ? 0.7 : 0.5
    });

    // Save the analysis result
    const savedAnalysis = await analysisResult.save();

    // Update the case with the analysis ID
    savedCase.lastAnalysisId = savedAnalysis._id;
    savedCase.analysisHistory.push({
      results: caseData.analysisResults,
      timestamp: new Date()
    });
    await savedCase.save();

    res.json({
      success: true,
      case: savedCase,
      analysis: savedAnalysis
    });

  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving analysis results',
      error: error.message
    });
  }
});

module.exports = router; 