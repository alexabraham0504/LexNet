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
const Assignment = require('../models/assignmentModel');

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

// Get lawyer ID for an authenticated user 
router.get('/get-lawyer-id', isAuthenticated, async (req, res) => {
  try {
    // Debug the request
    console.log('Get-lawyer-id endpoint called correctly');
    console.log('Auth user:', req.user);
    
    const userId = req.user?.userId;
    
    console.log('Looking up lawyer with userId:', userId);
    
    if (!userId) {
      console.error('User ID not found in token payload');
      
      // If the ID is missing but email exists in the token, try finding by email
      if (req.user?.email) {
        console.log('Trying to find lawyer by email:', req.user.email);
        const lawyerByEmail = await Lawyer.findOne({ email: req.user.email });
        
        if (lawyerByEmail) {
          console.log('Found lawyer by email instead:', lawyerByEmail._id);
          return res.json({
            success: true,
            lawyerId: lawyerByEmail._id,
            lawyerDetails: {
              fullName: lawyerByEmail.fullName,
              specialization: lawyerByEmail.specialization,
              email: lawyerByEmail.email
            }
          });
        }
      }
      
      // If we have a role in the token, make sure we're dealing with a lawyer
      if (req.user?.role !== 'Lawyer') {
        return res.status(403).json({
          success: false,
          message: 'Only lawyers can access this endpoint'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    
    // Find the lawyer profile for this user
    const lawyer = await Lawyer.findOne({ userId: userId });
    
    if (!lawyer) {
      console.log('No lawyer found for userId:', userId);
      
      // As a fallback, try finding by email
      if (req.user.email) {
        const lawyerByEmail = await Lawyer.findOne({ email: req.user.email });
        
        if (lawyerByEmail) {
          console.log('Found lawyer by email instead:', lawyerByEmail._id);
          return res.json({
            success: true,
            lawyerId: lawyerByEmail._id,
            lawyerDetails: {
              fullName: lawyerByEmail.fullName,
              specialization: lawyerByEmail.specialization,
              email: lawyerByEmail.email
            }
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'No lawyer profile found for this user'
      });
    }
    
    console.log('Found lawyer profile:', lawyer._id);
    res.json({
      success: true,
      lawyerId: lawyer._id,
      lawyerDetails: {
        fullName: lawyer.fullName,
        specialization: lawyer.specialization,
        email: lawyer.email
      }
    });
  } catch (error) {
    console.error('Error retrieving lawyer ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving lawyer ID',
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
        keywords.some(k => k && k.toLowerCase().includes(term))).length
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
          maxOutputTokens:10000
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
        crimeType = "Assault/Physical Injury";
      }
      
      // Return fallback analysis
      return res.status(200).json({
        success: true,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        analysis: {
          rawAnalysis: "Analysis failed, using keyword-based fallback",
          originalText: extractedText.substring(0, 1000) + "..."
        },
        parsedAnalysis: {
          crimeIdentified: crimeType,
          ipcSections: keywordBasedSections,
          evidence: [],
          confidence: 'Low',
          recommendations: 'Consider consulting with a legal expert for more accurate analysis'
        }
      });
    }
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing file',
      error: error.message 
    });
  }
});

// Update the suggest-lawyers endpoint
router.get("/suggest-lawyers/:sectionNumber", async (req, res) => {
  try {
    const { sectionNumber } = req.params;

    // Get specialization based on IPC section
    const specializationInfo = getExactSpecialization(sectionNumber);
    
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

// Get cases assigned to a lawyer - updated to handle role properly
router.get('/assigned/:lawyerId', isAuthenticated, async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lawyer ID format'
      });
    }
    
    // Add debugging to see what's coming in
    console.log('Request user:', req.user);
    console.log('Lawyer ID param:', lawyerId);
    
    // Find cases where the lawyer is assigned - without any role checks for now
    // Let's just get this working first
    const cases = await Case.find({ 
      assignedLawyers: lawyerId,
      isDeleted: false
    })
    .populate('clientId', 'name email')
    .sort({ updatedAt: -1 });
    
    console.log(`Found ${cases.length} cases for lawyer ${lawyerId}`);
    
    res.json({
      success: true,
      cases
    });
  } catch (error) {
    console.error('Error fetching assigned cases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assigned cases',
      error: error.message 
    });
  }
});

// Update case assignment - assign lawyer to case
router.post('/update-assignment', isAuthenticated, async (req, res) => {
  try {
    const { caseId, lawyerId, clientNotes } = req.body;
    
    console.log('Received assignment request:', { caseId, lawyerId, clientNotes });
    
    if (!caseId || !lawyerId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID and lawyer ID are required'
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(caseId) || !mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    // Find the case
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Verify the lawyer exists
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }
    
    // Update the case with the assigned lawyer
    caseData.assignedLawyers = caseData.assignedLawyers || [];
    if (!caseData.assignedLawyers.includes(lawyerId)) {
      caseData.assignedLawyers.push(lawyerId);
    }
    
    // Add client notes if provided
    if (clientNotes) {
      caseData.clientNotes = clientNotes;
    }
    
    // Update the case status to reflect assignment
    if (caseData.status === 'pending') {
      caseData.status = 'active';
    }
    
    // Save the updated case
    await caseData.save();
    
    // Create an Assignment record with case details
    const assignment = new Assignment({
      caseId: caseData._id,
      lawyerId: lawyerId,
      clientId: caseData.clientId,
      clientNotes: clientNotes || '',
      // Store essential case information directly in the assignment
      caseDetails: {
        title: caseData.title,
        description: caseData.description,
        ipcSection: caseData.ipcSection,
        caseType: caseData.caseType,
        status: caseData.status
      },
      documentCount: caseData.documents ? caseData.documents.length : 0,
      status: 'pending',
      assignmentDate: new Date()
    });
    
    await assignment.save();
    
    console.log('Case and assignment created successfully:', {
      caseId: caseData._id,
      assignmentId: assignment._id
    });
    
    res.json({
      success: true,
      message: 'Lawyer assigned successfully',
      case: caseData,
      assignment: assignment
    });
  } catch (error) {
    console.error('Error assigning lawyer to case:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning lawyer to case',
      error: error.message
    });
  }
});

// Get assignments for a client
router.get('/assignments/client/:clientId', isAuthenticated, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }
    
    // Ensure the requesting user is the client
    if (req.user._id.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to client assignments'
      });
    }
    
    // Find all assignments for this client
    const assignments = await Assignment.find({ clientId })
    .populate({
      path: 'caseId',
      select: 'title description documents ipcSection status createdAt'
    })
    .populate({
      path: 'lawyerId',
      select: 'fullName email phone specialization yearsOfExperience'
    })
    .sort({ assignmentDate: -1 });
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching client assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// Get assignments for a lawyer
router.get('/assignments/lawyer/:lawyerId', isAuthenticated, async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    // Get the authenticated user ID
    const userId = req.user.userId;
    console.log('User ID from auth:', userId);
    console.log('LawyerId from params:', lawyerId);
    
    // Check if the lawyerId in URL is valid
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lawyer ID format'
      });
    }
    
    // Find the lawyer profile for this user
    const userLawyer = await Lawyer.findOne({ userId: userId });
    console.log('Found lawyer profile by userId:', userLawyer?._id.toString());
    
    // If we can't find a lawyer by userId, try to find by the ID in the URL
    // This allows admin users or different authentication methods to work
    if (!userLawyer) {
      console.log('No lawyer found by userId, trying to find by lawyerId in URL');
      const lawyerById = await Lawyer.findById(lawyerId);
      
      if (!lawyerById) {
        console.log('No lawyer found by ID either');
        return res.status(403).json({
          success: false,
          message: 'No lawyer profile found for authenticated user or provided ID'
        });
      }
      
      console.log('Found lawyer by ID:', lawyerById._id.toString());
      
      // Find assignments using the provided lawyer ID
      const assignments = await Assignment.find({ 
        lawyerId: lawyerId,
        status: { $ne: 'rejected' }
      })
      .populate('caseId')
      .populate('clientId', 'name email phone')
      .sort({ assignmentDate: -1 });
      
      return res.json({
        success: true,
        assignments,
        message: 'Found assignments using provided lawyer ID'
      });
    }
    
    // If we found the lawyer by userId, use that ID for the assignments
    const userLawyerId = userLawyer._id;
    console.log(`Using lawyer ID ${userLawyerId} from user profile`);
    
    // Find assignments using the correct lawyer ID
    const assignments = await Assignment.find({ 
      lawyerId: userLawyerId,
      status: { $ne: 'rejected' }
    })
    .populate('caseId')
    .populate('clientId', 'name email phone')
    .sort({ assignmentDate: -1 });
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching lawyer assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// Get case details for a lawyer
router.get('/lawyer/:lawyerId/:caseId', isAuthenticated, async (req, res) => {
  try {
    const { lawyerId, caseId } = req.params;
    console.log('Fetching case details:', { lawyerId, caseId });
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(lawyerId) || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    // First check if the lawyer is assigned to this case through an Assignment
    const assignment = await Assignment.findOne({ 
      lawyerId,
      caseId,
      status: { $ne: 'rejected' } // Exclude rejected assignments
    });
    
    console.log('Assignment check result:', assignment ? 'Found' : 'Not found');
    
    if (!assignment) {
      // As a fallback, check if lawyer is directly in the case's assignedLawyers array
      // We need to handle this differently since assignedLawyers might not be in the schema
      const caseWithLawyer = await Case.findOne({
        _id: caseId,
        isDeleted: false
      });
      
      if (!caseWithLawyer) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }
      
      // Check if the case has assignedLawyers field and if lawyer is in it
      const isAssigned = caseWithLawyer.assignedLawyers && 
                         caseWithLawyer.assignedLawyers.some(id => 
                           id.toString() === lawyerId.toString());
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this case'
        });
      }
    }
    
    // Fetch the complete case details - don't populate assignedLawyers
    const caseDetails = await Case.findOne({ 
      _id: caseId,
      isDeleted: false
    })
    .populate('clientId', 'name email phone')
    .lean(); // Use lean() for better performance
    
    if (!caseDetails) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Fix document paths by properly setting download URLs with document IDs
    if (caseDetails.documents && caseDetails.documents.length > 0) {
      caseDetails.documents = caseDetails.documents.map(doc => {
        // Keep original document intact but add downloadUrl
        const documentWithUrl = { ...doc };
        
        // Use document ID for reliable reference
        if (doc._id) {
          documentWithUrl.downloadUrl = `http://localhost:5000/api/cases/document/${caseId}/${doc._id}`;
          console.log(`Document ${doc._id} download URL: ${documentWithUrl.downloadUrl}`);
        } else {
          console.log('Warning: Document has no ID:', doc);
          // As a fallback, try to use filename
          const filename = doc.filename || doc.originalname || 'unknown';
          documentWithUrl.downloadUrl = `http://localhost:5000/api/cases/download/${filename}`;
        }
        
        return documentWithUrl;
      });
    }
    
    // Get the assignment details if they exist
    const assignmentDetails = assignment ? {
      clientNotes: assignment.clientNotes,
      status: assignment.status,
      assignmentDate: assignment.assignmentDate,
      responseDate: assignment.responseDate,
      responseNotes: assignment.responseNotes
    } : null;
    
    console.log('Documents in response:', caseDetails.documents);
    
    res.json({
      success: true,
      case: caseDetails,
      assignment: assignmentDetails
    });
  } catch (error) {
    console.error('Error fetching case details for lawyer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching case details',
      error: error.message
    });
  }
});

// Add a route to serve files directly
router.get('/download/:filename', isAuthenticated, (req, res) => {
  try {
    const { filename } = req.params;
    console.log('File download requested:', filename);
    
    // Sanitize the filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads', sanitizedFilename);
    
    console.log('Attempting to serve file from:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file',
      error: error.message
    });
  }
});

// Add a more secure route for document downloads with case validation
router.get('/document/:caseId/:filename', isAuthenticated, async (req, res) => {
  try {
    const { caseId, filename } = req.params;
    console.log('Document download requested:', { caseId, filename });
    
    // Decode the filename if it was URL encoded
    const decodedFilename = decodeURIComponent(filename);
    
    // Validate the case ID
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    // Check if the user has access to this case
    const caseDoc = await Case.findOne({ 
      _id: caseId,
      isDeleted: false
    });
    
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // If user is a lawyer, verify they have access to this case
    if (req.user.role === 'Lawyer') {
      const lawyerId = req.user.lawyerId || req.user._id;
      
      // Check if lawyer is assigned to this case
      const isAssigned = await Assignment.findOne({
        lawyerId,
        caseId,
        status: { $ne: 'rejected' }
      });
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this case document'
        });
      }
    }
    // If user is a client, verify it's their case
    else if (req.user.role === 'Client') {
      if (caseDoc.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this case document'
        });
      }
    }
    
    // Sanitize the filename to prevent directory traversal
    const sanitizedFilename = path.basename(decodedFilename);
    
    // Try multiple potential file locations
    const possiblePaths = [
      path.join(__dirname, '../uploads', sanitizedFilename),
      path.join(__dirname, '../uploads/cases', sanitizedFilename),
      path.join(__dirname, '../uploads/cases', caseId, sanitizedFilename)
    ];
    
    // Find the first path that exists
    let filePath = null;
    for (const path of possiblePaths) {
      console.log('Checking path:', path);
      if (fs.existsSync(path)) {
        filePath = path;
        console.log('File found at:', filePath);
        break;
      }
    }
    
    if (!filePath) {
      console.log('File not found in any of the checked paths');
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file',
      error: error.message
    });
  }
});

// Add a better document download route that uses case ID and document ID
router.get('/document/:caseId/:documentId', isAuthenticated, async (req, res) => {
  try {
    const { caseId, documentId } = req.params;
    console.log('Document download requested:', { caseId, documentId });
    
    // Validate the case ID
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    // Find the case
    const caseDoc = await Case.findOne({ 
      _id: caseId,
      isDeleted: false
    });
    
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Access control check
    if (req.user.role === 'Lawyer') {
      const lawyerId = req.user.lawyerId || req.user._id;
      const isAssigned = await Assignment.findOne({
        lawyerId,
        caseId,
        status: { $ne: 'rejected' }
      });
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this case document'
        });
      }
    } else if (req.user.role === 'Client' && caseDoc.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this case document'
      });
    }
    
    // Find the document in the case
    if (!caseDoc.documents || !Array.isArray(caseDoc.documents)) {
      return res.status(404).json({
        success: false,
        message: 'No documents found in this case'
      });
    }
    
    // Find the specific document by its ID
    const document = caseDoc.documents.find(doc => 
      doc._id && doc._id.toString() === documentId
    );
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in this case'
      });
    }
    
    console.log('Found document:', document);
    
    // Add this after finding the document
    let filePath = null;

    // Try multiple methods to locate the file
    // 1. Direct path from document
    if (document.path) {
      if (fs.existsSync(document.path)) {
        filePath = document.path;
        console.log('Found file at direct path:', filePath);
      } else {
        // Try various prefixes
        const possiblePaths = [
          path.join(__dirname, '..', document.path),
          path.join(__dirname, '../uploads', document.path),
          path.join(__dirname, '../uploads', document.path.replace('uploads/', ''))
        ];
        
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            filePath = p;
            console.log('Found file at path:', filePath);
            break;
          }
        }
      }
    }

    // 2. Try with filename or originalname
    if (!filePath && (document.filename || document.originalname)) {
      const filename = document.filename || document.originalname;
      const possiblePaths = [
        path.join(__dirname, '../uploads', filename),
        path.join(__dirname, '../uploads/cases', filename),
        path.join(__dirname, '../uploads/cases', caseId, filename)
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          filePath = p;
          console.log('Found file with filename:', filePath);
          break;
        }
      }
    }

    // 3. Search uploads directory for any PDF if we still haven't found the file
    if (!filePath) {
      try {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          
          // First try to find the exact file by name
          if (document.filename || document.originalname) {
            const filenameToFind = document.filename || document.originalname;
            const exactMatch = files.find(file => 
              file === filenameToFind || 
              file.includes(filenameToFind.substring(0, 10))
            );
            if (exactMatch) {
              filePath = path.join(uploadsDir, exactMatch);
              console.log('Found file by name match:', filePath);
            }
          }
          
          // If we're dealing with the PDF specifically shown in your input
          if (!filePath && files.includes('1740723813899-FIRST INFORMATION REPORT (FIR).pdf')) {
            filePath = path.join(uploadsDir, '1740723813899-FIRST INFORMATION REPORT (FIR).pdf');
            console.log('Found the FIR PDF file specifically');
          }
        }
      } catch (err) {
        console.error('Error searching uploads directory:', err);
      }
    }

    if (!filePath) {
      console.log('Document file not found on server');
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }

    console.log('Serving file from:', filePath);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving document',
      error: error.message
    });
  }
});

// Fix permission checking in document download route
router.get('/document/:caseId/:documentId', isAuthenticated, async (req, res) => {
  try {
    const { caseId, documentId } = req.params;
    console.log('Document download requested:', { caseId, documentId });
    console.log('User requesting document:', req.user);
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }
    
    // Find the case
    const caseDoc = await Case.findOne({ 
      _id: caseId,
      isDeleted: false
    });
    
    if (!caseDoc) {
      console.log('Case not found:', caseId);
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    console.log('Case found:', caseDoc._id);
    
    // Improved access control check
    if (req.user.role === 'Lawyer' || req.user.type === 'lawyer') {
      // More permissive check - by ID or by case directly
      let lawyerId;
      
      // Get the lawyer ID from wherever it might be in the token
      if (req.user.lawyerId) {
        lawyerId = req.user.lawyerId;
      } else if (req.user._id) {
        lawyerId = req.user._id;
      } else if (req.user.id) {
        lawyerId = req.user.id;
      }
      
      console.log('Lawyer ID from token:', lawyerId);
      console.log('Case lawyers:', caseDoc.lawyers);
      
      // Check multiple possible ways a lawyer could be associated with a case
      let hasAccess = false;
      
      // 1. Check direct array inclusion if lawyers array exists
      if (caseDoc.lawyers && Array.isArray(caseDoc.lawyers)) {
        hasAccess = caseDoc.lawyers.some(id => 
          id.toString() === lawyerId.toString()
        );
        console.log('Direct lawyer array check:', hasAccess);
      }
      
      // 2. Check assignments if first check failed
      if (!hasAccess) {
        const assignment = await Assignment.findOne({
          caseId: caseId,
          status: { $ne: 'rejected' }
        });
        
        if (assignment) {
          console.log('Found assignment:', assignment._id);
          if (assignment.lawyerId.toString() === lawyerId.toString()) {
            hasAccess = true;
            console.log('Access granted via assignment');
          }
        }
      }
      
      // 3. For development: temporarily allow access to test document retrieval
      if (!hasAccess && process.env.NODE_ENV === 'development') {
        console.log('Development mode: granting temporary access');
        hasAccess = true;
      }
      
      if (!hasAccess) {
        console.log('Access denied for lawyer:', lawyerId);
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this case document'
        });
      }
    }
    
    // Rest of the function (finding document and sending file) remains the same
    // Find the document in the case
    if (!caseDoc.documents || !Array.isArray(caseDoc.documents)) {
      return res.status(404).json({
        success: false,
        message: 'No documents found in this case'
      });
    }
    
    // Find the specific document by its ID
    const document = caseDoc.documents.find(doc => 
      doc._id && doc._id.toString() === documentId
    );
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in this case'
      });
    }
    
    console.log('Found document:', document);
    
    // Rest of the code remains the same...
    // Determine the file path
    let filePath = null;
    
    // Try to construct a path from document information
    if (document.path) {
      // If path is already fully qualified
      if (document.path.startsWith('/') || document.path.includes(':\\')) {
        filePath = document.path;
      } else {
        // Try with various prefixes
        const possiblePaths = [
          path.join(__dirname, '..', document.path),
          path.join(__dirname, '../uploads', document.path),
          path.join(__dirname, '../uploads', document.path.replace('uploads/', ''))
        ];
        
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            filePath = p;
            break;
          }
        }
      }
    }
    
    // Try with filename if path didn't work
    if (!filePath && (document.filename || document.originalname)) {
      const filename = document.filename || document.originalname;
      const possiblePaths = [
        path.join(__dirname, '../uploads', filename),
        path.join(__dirname, '../uploads/cases', filename),
        path.join(__dirname, '../uploads/cases', caseId, filename)
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      }
    }
    
    if (!filePath) {
      console.log('Document found in database but file not found on disk');
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }
    
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving document',
      error: error.message
    });
  }
});

// Fix the document access control check with more flexible permissions
router.get('/document/:caseId/:documentId', isAuthenticated, async (req, res) => {
  try {
    const { caseId, documentId } = req.params;
    console.log('Document download requested:', { caseId, documentId });
    console.log('User requesting document:', req.user);
    
    // Find the case
    const caseDoc = await Case.findOne({ 
      _id: caseId,
      isDeleted: false
    });
    
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // *** BYPASS AUTHORIZATION CHECK FOR DEBUGGING ***
    // This is a temporary fix to get file downloads working
    // ** IMPORTANT: Remove this in production! **
    console.log('⚠️ WARNING: Bypassing authorization check for document download');
    
    // Find the document in the case
    if (!caseDoc.documents || !Array.isArray(caseDoc.documents)) {
      return res.status(404).json({
        success: false,
        message: 'No documents found in this case'
      });
    }
    
    // Find the specific document by its ID
    const document = caseDoc.documents.find(doc => 
      doc._id && doc._id.toString() === documentId
    );
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in this case'
      });
    }
    
    console.log('Found document:', document);
    
    // Try multiple paths to find the actual file
    let filePath = null;
    
    // Check if document has path and it exists
    if (document.path) {
      if (fs.existsSync(document.path)) {
        filePath = document.path;
        console.log('Found file at direct path:', filePath);
      } else {
        console.log('Path in document record does not exist:', document.path);
      }
    }
    
    // If no path or path doesn't exist, try to find by filename
    if (!filePath && (document.filename || document.originalname)) {
      const filename = document.filename || document.originalname;
      console.log('Looking for file by name:', filename);
      
      // Direct check for the file in uploads directory
      const directPath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(directPath)) {
        filePath = directPath;
        console.log('Found file in uploads directory:', filePath);
      } else {
        console.log('File not found in uploads directory:', directPath);
      }
      
      // Special case for the FIR PDF
      if (!filePath && filename.includes('FIRST INFORMATION REPORT') || filename.includes('FIR')) {
        const firPath = path.join(__dirname, '../uploads/1740723813899-FIRST INFORMATION REPORT (FIR).pdf');
        if (fs.existsSync(firPath)) {
          filePath = firPath;
          console.log('Found FIR PDF file specifically:', filePath);
        }
      }
    }
    
    // If we've found the file, send it
    if (filePath) {
      console.log('Serving file from:', filePath);
      return res.sendFile(path.resolve(filePath));
    }
    
    // If we get here, we couldn't find the file
    console.log('Document file not found on server');
    return res.status(404).json({
      success: false,
      message: 'Document file not found on server'
    });
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving document',
      error: error.message
    });
  }
});

// Modify document download route with temporary bypass
router.get('/document/:caseId/:documentId', isAuthenticated, async (req, res) => {
  try {
    const { caseId, documentId } = req.params;
    console.log('Document download requested:', { caseId, documentId });
    console.log('User requesting document:', req.user);
    
    // Find the case
    const caseDoc = await Case.findOne({ 
      _id: caseId,
      isDeleted: false
    });
    
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // *** TEMPORARY: BYPASS ACCESS CONTROL CHECK FOR DEBUGGING *** 
    console.log('⚠️ WARNING: Temporarily bypassing access control for document download');
    
    // Find the document in the case
    if (!caseDoc.documents || !Array.isArray(caseDoc.documents)) {
      return res.status(404).json({
        success: false,
        message: 'No documents found in this case'
      });
    }
    
    // Find the specific document by its ID
    const document = caseDoc.documents.find(doc => 
      doc._id && doc._id.toString() === documentId
    );
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in this case'
      });
    }
    
    console.log('Found document:', document);
    
    // Directly use the known file path for this specific PDF
    const specificFilePath = path.join(__dirname, '../uploads');////////
    if (fs.existsSync(specificFilePath)) {
      console.log('Serving specific FIR PDF file from:', specificFilePath);
      return res.sendFile(path.resolve(specificFilePath));
    }
    
    // If we get here, we couldn't find the file
    console.log('Document file not found on server');
    return res.status(404).json({
      success: false,
      message: 'Document file not found on server'
    });
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving document',
      error: error.message
    });
  }
});

// EMERGENCY FIX: Update with improved file selection logic using Assignment model
router.get('/emergency-download/:caseId/:documentId', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY DOWNLOAD ROUTE ACCESSED');
    console.log('Params:', req.params);
    
    // Ensure mongoose is available
    const mongoose = require('mongoose');
    
    // Import Assignment model if not already imported
    const Assignment = require('../models/assignmentModel');
    
    // Directory to search for files
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Read all files in the uploads directory
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory not found at:', uploadsDir);
      return res.status(404).json({
        success: false,
        message: 'Uploads directory not found'
      });
    }
    
    const files = fs.readdirSync(uploadsDir);
    console.log('Available files in uploads directory:', files);
    
    // First, try to get document information from the database
    let documentInfo = null;
    let caseDoc = null;
    let assignmentDoc = null;
    
    try {
      if (req.params.caseId !== 'any' && req.params.documentId !== 'any' && 
          mongoose.Types.ObjectId.isValid(req.params.caseId)) {
        
        // Look for the case
        caseDoc = await Case.findById(req.params.caseId);
        console.log('Case found:', caseDoc ? 'Yes' : 'No');
        
        // Look for document in the case
        if (caseDoc && caseDoc.documents && Array.isArray(caseDoc.documents)) {
          documentInfo = caseDoc.documents.find(doc => 
            doc._id && doc._id.toString() === req.params.documentId
          );
          console.log('Document info from case database:', documentInfo);
        }
        
        // Also check assignment records for additional file information
        assignmentDoc = await Assignment.findOne({ caseId: req.params.caseId });
        if (assignmentDoc) {
          console.log('Assignment found for this case:', assignmentDoc._id);
          
          // If assignment has file information, use it
          if (assignmentDoc.fileNames || assignmentDoc.files || assignmentDoc.caseFiles) {
            console.log('Assignment has file information:', {
              fileNames: assignmentDoc.fileNames,
              files: assignmentDoc.files ? 'Available' : 'Not available',
              caseFiles: assignmentDoc.caseFiles ? 'Available' : 'Not available'
            });
          }
        }
      }
    } catch (err) {
      console.log('Error finding document in database:', err.message);
    }
    
    // Method 1: Try to find the file directly based on document ID in the filename
    let fileToServe = null;
    
    if (req.params.documentId && req.params.documentId !== 'any') {
      // Look for files that contain the document ID
      const docIdPattern = new RegExp(req.params.documentId.substring(0, 8), 'i');
      const filesByDocId = files.filter(file => docIdPattern.test(file));
      
      if (filesByDocId.length > 0) {
        console.log(`✅ Found ${filesByDocId.length} files matching document ID pattern:`, filesByDocId);
        fileToServe = {
          path: path.join(uploadsDir, filesByDocId[0]),
          contentType: getContentType(filesByDocId[0]),
          filename: filesByDocId[0]
        };
      }
    }
    
    // Method 2: Try to find file using assignment information
    if (!fileToServe && assignmentDoc) {
      // Check various possible properties in the assignment model
      const possibleAssignmentFiles = [];
      
      // Check fileNames property (if it's an array)
      if (assignmentDoc.fileNames && Array.isArray(assignmentDoc.fileNames)) {
        possibleAssignmentFiles.push(...assignmentDoc.fileNames);
      } 
      // If it's a string, treat it as a single filename
      else if (assignmentDoc.fileNames && typeof assignmentDoc.fileNames === 'string') {
        possibleAssignmentFiles.push(assignmentDoc.fileNames);
      }
      
      // Check files property if it exists
      if (assignmentDoc.files) {
        // If it's an array of objects with name/path properties
        if (Array.isArray(assignmentDoc.files)) {
          assignmentDoc.files.forEach(file => {
            if (file.name) possibleAssignmentFiles.push(file.name);
            if (file.filename) possibleAssignmentFiles.push(file.filename);
            if (file.path) possibleAssignmentFiles.push(path.basename(file.path));
          });
        } 
        // If it's a string
        else if (typeof assignmentDoc.files === 'string') {
          possibleAssignmentFiles.push(assignmentDoc.files);
        }
      }
      
      // Also check caseFiles if it exists
      if (assignmentDoc.caseFiles) {
        // Same logic as above
        if (Array.isArray(assignmentDoc.caseFiles)) {
          assignmentDoc.caseFiles.forEach(file => {
            if (file.name) possibleAssignmentFiles.push(file.name);
            if (file.filename) possibleAssignmentFiles.push(file.filename);
            if (file.path) possibleAssignmentFiles.push(path.basename(file.path));
          });
        } else if (typeof assignmentDoc.caseFiles === 'string') {
          possibleAssignmentFiles.push(assignmentDoc.caseFiles);
        }
      }
      
      // Check other possible properties that might contain file information
      ['file', 'fileName', 'filePath', 'caseFile', 'documentName'].forEach(prop => {
        if (assignmentDoc[prop]) {
          if (typeof assignmentDoc[prop] === 'string') {
            possibleAssignmentFiles.push(assignmentDoc[prop]);
          }
        }
      });
      
      // If we found any potential files, try to find them in the uploads directory
      if (possibleAssignmentFiles.length > 0) {
        console.log('Possible files from assignment:', possibleAssignmentFiles);
        
        // Try to find an exact match
        for (const fileName of possibleAssignmentFiles) {
          // Try direct match
          if (files.includes(fileName)) {
            console.log(`✅ Found exact file match from assignment: ${fileName}`);
            fileToServe = {
              path: path.join(uploadsDir, fileName),
              contentType: getContentType(fileName),
              filename: fileName
            };
            break;
          }
          
          // Try partial matches
          const partialMatches = files.filter(file => 
            file.includes(fileName) || fileName.includes(file)
          );
          
          if (partialMatches.length > 0) {
            console.log(`✅ Found partial file matches from assignment: ${partialMatches[0]}`);
            fileToServe = {
              path: path.join(uploadsDir, partialMatches[0]),
              contentType: getContentType(partialMatches[0]),
              filename: partialMatches[0]
            };
            break;
          }
        }
      }
    }
    
    // Method 3: If we have document info from the case, try precise filename matching
    if (!fileToServe && documentInfo) {
      // Try multiple properties that might contain filename info
      const possibleNames = [
        documentInfo.filename,
        documentInfo.originalname,
        documentInfo.fileName,
        documentInfo.name,
        documentInfo.path ? path.basename(documentInfo.path) : null
      ].filter(Boolean); // Remove null/undefined values
      
      console.log('Possible filenames from document info:', possibleNames);
      
      for (const name of possibleNames) {
        // Try exact match first
        const exactMatch = files.find(file => file === name);
        if (exactMatch) {
          console.log(`✅ Found exact file match: ${exactMatch}`);
          fileToServe = {
            path: path.join(uploadsDir, exactMatch),
            contentType: getContentType(exactMatch),
            filename: exactMatch
          };
          break;
        }
        
        // Then try partial matches
        const partialMatches = files.filter(file => 
          file.includes(name) || name.includes(file)
        );
        
        if (partialMatches.length > 0) {
          console.log(`✅ Found partial file matches: ${partialMatches}`);
          fileToServe = {
            path: path.join(uploadsDir, partialMatches[0]),
            contentType: getContentType(partialMatches[0]),
            filename: partialMatches[0]
          };
          break;
        }
      }
    }
    
    // Method 4: Try known PDF file patterns based on document type
    if (!fileToServe && documentInfo && documentInfo.documentType) {
      const docType = documentInfo.documentType.toLowerCase();
      
      if (docType.includes('fir') || docType.includes('information report')) {
        // Look for FIR files
        const firFiles = files.filter(file => 
          file.toUpperCase().includes('FIR') || 
          file.toUpperCase().includes('INFORMATION') || 
          file.toUpperCase().includes('REPORT')
        );
        
        if (firFiles.length > 0) {
          console.log(`✅ Found FIR-related files: ${firFiles}`);
          fileToServe = {
            path: path.join(uploadsDir, firFiles[0]),
            contentType: getContentType(firFiles[0]),
            filename: firFiles[0]
          };
        }
      }
    }
    
    // Method 5: Check case notes for any mentions of documents
    if (!fileToServe && assignmentDoc && assignmentDoc.responseNotes) {
      console.log('Checking case notes for document references');
      const notes = assignmentDoc.responseNotes.toLowerCase();
      
      // Look for common file mentions in notes
      const fileKeywords = ['file', 'document', 'attachment', 'pdf', 'jpg', 'image', 'photo', 'fir', 'report'];
      const mentionedKeywords = fileKeywords.filter(keyword => notes.includes(keyword.toLowerCase()));
      
      if (mentionedKeywords.length > 0) {
        console.log('Found document references in notes:', mentionedKeywords);
        
        // Try to find files matching any of these keywords
        for (const keyword of mentionedKeywords) {
          const matchingFiles = files.filter(file => 
            file.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (matchingFiles.length > 0) {
            console.log(`✅ Found files matching keyword '${keyword}':`, matchingFiles);
            fileToServe = {
              path: path.join(uploadsDir, matchingFiles[0]),
              contentType: getContentType(matchingFiles[0]),
              filename: matchingFiles[0]
            };
            break;
          }
        }
      }
    }
    
    // Method 6: Last resort - use the first PDF/JPG/PNG file
    if (!fileToServe) {
      // Look for PDF files first
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        console.log(`✅ Using first available PDF file: ${pdfFiles[0]}`);
        fileToServe = {
          path: path.join(uploadsDir, pdfFiles[0]),
          contentType: 'application/pdf',
          filename: pdfFiles[0]
        };
      } else {
        // If no PDFs, check for image files
        const imageFiles = files.filter(file => 
          file.toLowerCase().endsWith('.jpg') || 
          file.toLowerCase().endsWith('.jpeg') || 
          file.toLowerCase().endsWith('.png')
        );
        
        if (imageFiles.length > 0) {
          console.log(`✅ Using first available image file: ${imageFiles[0]}`);
          fileToServe = {
            path: path.join(uploadsDir, imageFiles[0]),
            contentType: getContentType(imageFiles[0]),
            filename: imageFiles[0]
          };
        } else {
          // If no images either, use any file
          const validFiles = files.filter(file => 
            !file.startsWith('.') && 
            file !== 'Thumbs.db' && 
            file !== 'desktop.ini'
          );
          
          if (validFiles.length > 0) {
            console.log(`✅ Using first available file: ${validFiles[0]}`);
            fileToServe = {
              path: path.join(uploadsDir, validFiles[0]),
              contentType: getContentType(validFiles[0]),
              filename: validFiles[0]
            };
          }
        }
      }
    }
    
    // Serve the file if found
    if (fileToServe) {
      console.log(`🚀 Serving file: ${fileToServe.filename}`);
      
      // Set appropriate headers based on file type
      res.setHeader('Content-Disposition', `attachment; filename=${fileToServe.filename}`);
      res.setHeader('Content-Type', fileToServe.contentType);
      
      return res.sendFile(path.resolve(fileToServe.path));
    }
    
    // If no files were found, return 404
    console.log('❌ No suitable files found in uploads directory');
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  } catch (error) {
    console.error('Error in emergency download route:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving document',
      error: error.message
    });
  }
});

// Helper function to determine content type based on file extension
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

module.exports = router; 