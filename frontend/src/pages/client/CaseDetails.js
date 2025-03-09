import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFile, faSpinner, faImage, faExclamationCircle, faChevronDown, faChevronUp, faFilter, faTrash, faInfoCircle, faUserTie, faCalendarPlus, faUserCircle, faGavel, faExternalLink, faBriefcase, faMoneyBill, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';
import Footer from '../../components/footer/footer-admin';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import './CaseDetails.css';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';
import api from '../../config/api.config';
// Import the utility functions
import { IPC_SPECIALIZATION_MAP, getSpecializationForSection } from '../../utils/ipcUtils';

// Set PDF.js workerSrc
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const EXTENDED_IPC_MAP = {
  ...IPC_SPECIALIZATION_MAP,
  // Add any additional mappings specific to this component
};

const validateLegalContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Convert to lowercase and split into words
  const words = text.toLowerCase().split(/\W+/);
  const uniqueWords = new Set(words);
  
  // Add more relevant keywords
  const LEGAL_KEYWORDS = [
    'section', 'act', 'court', 'judgment', 'petition', 'plaintiff', 'defendant',
    'prosecution', 'accused', 'witness', 'evidence', 'hearing', 'trial',
    'appeal', 'jurisdiction', 'law', 'legal', 'criminal', 'civil', 'judge',
    'magistrate', 'advocate', 'complaint', 'case', 'ipc', 'penal', 'code',
    'fir', 'police', 'investigation', 'report', 'statement', 'charge', 'offense',
    'crime', 'victim', 'suspect', 'arrest', 'bail', 'warrant', 'court'
  ];
  
  // Count legal keywords with more lenient threshold
  const legalTermCount = LEGAL_KEYWORDS.reduce((count, keyword) => {
    return uniqueWords.has(keyword) ? count + 1 : count;
  }, 0);
  
  // Reduce threshold to 2 terms
  return legalTermCount >= 2;
};

// Constants
const BING_API_KEY = "21f82301b9544a57bd153b1b4d7f3a03";
// const GOOGLE_CLOUD_API_KEY = 'AIzaSyBLSAPqtZQ4KhCTNP9zkM2Dke9giqwhENc';
const GOOGLE_CLOUD_API_KEY = 'AIzaSyAHYLe2DbpNl4NgY79sQtvcHEk-jSbh_SM';


// Add Gemini API constant
// const GEMINI_API_KEY = 'AIzaSyBLSAPqtZQ4KhCTNP9zkM2Dke9giqwhENc';
const GEMINI_API_KEY = 'AIzaSyAHYLe2DbpNl4NgY79sQtvcHEk-jSbh_SM';


// Add IPC section definitions
const IPC_SECTIONS = {
  '302': {
    title: 'Murder',
    definition: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
    explanation: 'Murder is the intentional killing of another person with premeditation or during the commission of certain felonies.',
    punishment: 'Death penalty or life imprisonment with fine',
    category: 'Violent Crimes'
  },
  '376': {
    title: 'Rape',
    definition: 'Sexual assault committed without consent or with consent obtained under duress or false pretenses.',
    explanation: 'Sexual intercourse without consent or with consent obtained through fear, coercion, or deception.',
    punishment: 'Rigorous imprisonment not less than 10 years, extendable to life imprisonment, with fine',
    category: 'Sexual Offenses'
  },
  // Add more IPC sections as needed
};

// Define IPC_SPECIALIZATION_MAP at the top level of your component
// const IPC_SPECIALIZATION_MAP = {
//   // Environmental violations
//   '268': 'Environmental Law',
//   // ...
// };

const analyzeWithGemini = async (text, file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    
    if (text) {
      formData.append('extractedText', text);
    }

    console.log('Sending file for analysis:', file.name);

    // Add a more robust prompt that specifically asks for IPC sections
    formData.append('prompt', `
      Analyze this legal document and identify:
      1. The primary crime or offense described
      2. Applicable IPC (Indian Penal Code) sections with their descriptions
      3. Key evidence mentioned in the document

      The text may be unclear due to OCR issues. Do your best to interpret it.
      If you cannot determine specific information, indicate that clearly.

      Format your response exactly as follows:
      CRIME IDENTIFIED: [primary crime or "Unable to determine from provided text"]

      IPC SECTIONS:
      - [section number] ([brief title]): [short description of the section]
      - [section number] ([brief title]): [short description of the section]
      - [section number] ([brief title]): [short description of the section]

      EVIDENCE:
      - [evidence point 1]
      - [evidence point 2]
      - [evidence point 3]

      ANALYSIS CONFIDENCE: [High/Medium/Low/Very Low]

      RECOMMENDATIONS: [Any recommendations for better document processing]
    `);

    // Use the analyze-direct endpoint with gemini-1.5-pro-latest
    const response = await api.post('/api/cases/analyze-direct', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      timeout: 180000 // 3 minutes
    });

    if (!response.data) {
      throw new Error('No response received from server');
    }

    console.log("API response:", response.data);

    // Extract the analysis text from the response
    const analysisText = response.data.analysis.rawAnalysis;
    console.log("Raw analysis text:", analysisText);
    
    // Parse the analysis to extract structured information with improved regex
    const crimeMatch = analysisText.match(/CRIME(?:\sIDENTIFIED)?:\s*([\s\S]*?)(?=\n\n|\nIPC|$)/i);
    
    // Improved IPC sections parsing to handle the new format
    const ipcSectionsMatch = analysisText.match(/IPC\sSECTIONS:(?:\n|)([\s\S]*?)(?=\n\n|\nEVIDENCE|$)/i);
    let ipcSections = [];
    
    if (ipcSectionsMatch && ipcSectionsMatch[1]) {
      // Extract each section line by line
      const sectionLines = ipcSectionsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || /^\d+/.test(line));
      
      // Parse each section line
      ipcSections = sectionLines.map(line => {
        // Remove leading dash if present
        line = line.replace(/^-\s*/, '');
        
        // Try to extract section number and description
        const sectionMatch = line.match(/(\d+[A-Za-z]?)\s*(?:\(([^)]+)\))?:?\s*(.*)/);
        
        if (sectionMatch) {
          return {
            number: sectionMatch[1],
            title: sectionMatch[2] || '',
            description: sectionMatch[3] || ''
          };
        }
        
        // If the format doesn't match, just return the whole line
        return { number: 'Unknown', title: '', description: line };
      });
    } else if (response.data.parsedAnalysis?.ipcSections) {
      // Use the backend-parsed sections if available
      ipcSections = response.data.parsedAnalysis.ipcSections.map(section => {
        if (typeof section === 'string') {
          const sectionMatch = section.match(/(\d+[A-Za-z]?)\s*(?:\(([^)]+)\))?/);
          if (sectionMatch) {
            return {
              number: sectionMatch[1],
              title: sectionMatch[2] || '',
              description: ''
            };
          }
          return { number: section, title: '', description: '' };
        }
        return section;
      });
    }
    
    const evidenceMatch = analysisText.match(/EVIDENCE:(?:\n|)([\s\S]*?)(?=\n\n|\nANALYSIS|$)/i);
    const confidenceMatch = analysisText.match(/ANALYSIS\sCONFIDENCE:\s*([\s\S]*?)(?=\n\n|\nRECOMMENDATIONS|$)/i);
    const recommendationsMatch = analysisText.match(/RECOMMENDATIONS:\s*([\s\S]*?)(?=\n\n|$)/i);
    
    // Create a structured result with the improved IPC sections
    const parsedAnalysis = {
      crimeIdentified: crimeMatch?.[1]?.trim() || 'Unable to determine from provided text',
      ipcSections: ipcSections,
      evidence: evidenceMatch?.[1]
        ? evidenceMatch[1].split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.startsWith('•'))
            .map(line => line.replace(/^[-•]\s*/, ''))
        : ['Unable to extract clear evidence points'],
      confidence: confidenceMatch?.[1]?.trim() || 'Very Low',
      recommendations: recommendationsMatch?.[1]?.trim() || 'Consider uploading a clearer document or manually entering key details'
    };
    
    console.log("Parsed analysis:", parsedAnalysis);
    
    // Return the structured analysis
    return {
      ...response.data,
      parsedAnalysis,
      analysisText
    };

  } catch (error) {
    console.error('Analysis error:', error);
    if (error.response?.data?.message) {
      throw new Error(`Analysis failed: ${error.response.data.message}`);
    }
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

const extractTextFromDocument = async (file) => {
  try {
    let extractedText = '';

    if (file.type === 'application/pdf') {
      try {
        console.log('Processing PDF:', file.name);
        
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        console.log('PDF loaded, pages:', pdf.numPages);
        
        const textContent = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          textContent.push(pageText);
        }

        extractedText = textContent.join('\n');

      } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    } 
    else if (file.type.includes('image')) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/api/cases/extract-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (!response.data || !response.data.text) {
          throw new Error('No text extracted from image');
        }

        extractedText = response.data.text;

      } catch (error) {
        console.error('Image extraction error:', error);
        throw new Error(`Failed to extract text from image: ${error.message}`);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    console.log('Extracted text:', extractedText.substring(0, 200) + '...');

    try {
      // Pass both text and original file to analyzeWithGemini
      const analysisResult = await analyzeWithGemini(extractedText, file);
      
      return {
        text: extractedText,
        analysis: analysisResult
      };
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      return {
        text: extractedText,
        analysis: {
          error: analysisError.message,
          partialResults: true
        }
      };
    }

  } catch (error) {
    console.error('Error in extractTextFromDocument:', error);
    throw error;
  }
};

// Update the parseAnalysisResults function to handle non-string inputs
const parseAnalysisResults = (analysisText) => {
  // Check if analysisText is a string, if not try to extract it from the object
  if (!analysisText) return {};
  
  // If analysisText is an object, try to extract the text property
  if (typeof analysisText === 'object') {
    if (analysisText.text) {
      analysisText = analysisText.text;
    } else if (analysisText.analysisText) {
      analysisText = analysisText.analysisText;
    } else {
      console.error("Unable to extract text from analysis object:", analysisText);
      return {
        crimeIdentified: "Unknown Crime",
        ipcSections: [],
        evidence: "No evidence extracted",
        legalReasoning: ""
      };
    }
  }
  
  // Ensure analysisText is a string before using substring
  if (typeof analysisText !== 'string') {
    console.error("Analysis text is not a string:", typeof analysisText, analysisText);
    return {
      crimeIdentified: "Unknown Crime",
      ipcSections: [],
      evidence: "No evidence extracted",
      legalReasoning: ""
    };
  }
  
  console.log("Raw analysis text:", analysisText.substring(0, 500) + "...");
  
  const sections = {
    crimeIdentified: analysisText.match(/CRIME(?:\sIDENTIFIED)?:\s*([\s\S]*?)(?=\n\n|\nIPC|$)/i)?.[1]?.trim(),
    ipcSections: [],
    evidence: analysisText.match(/EVIDENCE(?:\sANALYSIS)?:\s*([\s\S]*?)(?=\n\n|$)/i)?.[1]?.trim(),
    legalReasoning: analysisText.match(/LEGAL\sREASONING:\s*([\s\S]*?)(?=\n\n|$)/i)?.[1]?.trim(),
  };

  // Extract IPC sections with more flexible pattern matching
  let ipcSectionMatches;
  
  // Try different patterns to extract IPC sections
  const patterns = [
    // Pattern 1: Section X: Title\n\nSECTION DETAILS:
    /Section\s+(\d+[A-Z]?)(?:\s*:\s*([^\n]*))?(?:\n\n)?SECTION\s+DETAILS:\s*([\s\S]*?)(?=\n\nSection\s+\d|EVIDENCE|$)/gi,
    
    // Pattern 2: Just look for Section numbers
    /Section\s+(\d+[A-Z]?)(?:\s*:\s*([^\n]*))?(?:\n\n)?([\s\S]*?)(?=\n\nSection\s+\d|EVIDENCE|$)/gi,
    
    // Pattern 3: IPC SECTIONS: list format
    /IPC\s+SECTIONS:\s*([\s\S]*?)(?=\n\n|$)/i
  ];
  
  // Try each pattern until we find matches
  for (const pattern of patterns) {
    if (pattern.toString().includes('IPC')) {
      // Handle list format
      const match = analysisText.match(pattern);
      if (match && match[1]) {
        const sectionsList = match[1].split(',').map(s => s.trim());
        console.log("Found IPC sections list:", sectionsList);
        
        // For each section in the list, look for its details elsewhere in the text
        sectionsList.forEach(sectionNum => {
          // Clean up section number
          const cleanSectionNum = sectionNum.replace(/^Section\s+/i, '').trim();
          
          // Look for details about this section
          const sectionDetailRegex = new RegExp(`Section\\s+${cleanSectionNum}[^\\n]*\\n\\n([\\s\\S]*?)(?=\\n\\nSection|EVIDENCE|$)`, 'i');
          const detailsMatch = analysisText.match(sectionDetailRegex);
          
          sections.ipcSections.push({
            number: cleanSectionNum,
            title: `Section ${cleanSectionNum} of IPC`,
            definition: detailsMatch?.[1]?.trim() || "No detailed information available",
            keyElements: "",
            punishment: "",
            notableCases: ""
          });
        });
        
        if (sections.ipcSections.length > 0) break;
      }
    } else {
      // Handle detailed section format
      ipcSectionMatches = [...analysisText.matchAll(pattern)];
      if (ipcSectionMatches && ipcSectionMatches.length > 0) {
        console.log("Found detailed IPC sections:", ipcSectionMatches.length);
        
        for (const match of ipcSectionMatches) {
          const sectionNumber = match[1];
          const sectionTitle = match[2] || `Section ${sectionNumber} of IPC`;
          const sectionDetails = match[3];
          
          // Extract components from section details
          const definition = sectionDetails.match(/Definition:\s*([\s\S]*?)(?=\nKey Elements|\nPunishment|\n\n|$)/i)?.[1]?.trim();
          const keyElements = sectionDetails.match(/Key Elements:\s*([\s\S]*?)(?=\nPunishment|\n\n|$)/i)?.[1]?.trim();
          const punishment = sectionDetails.match(/Punishment:\s*([\s\S]*?)(?=\nNotable Cases|\n\n|$)/i)?.[1]?.trim();
          const notableCases = sectionDetails.match(/Notable Cases:\s*([\s\S]*?)(?=\n\n|$)/i)?.[1]?.trim();
          
          sections.ipcSections.push({
            number: sectionNumber,
            title: sectionTitle,
            definition: definition || sectionDetails.trim(),
            keyElements: keyElements || "",
            punishment: punishment || "",
            notableCases: notableCases || ""
          });
        }
        
        if (sections.ipcSections.length > 0) break;
      }
    }
  }

  console.log("Parsed sections:", sections);
  return sections;
};

// Update the processDocument function to use the improved parser
const processDocument = async (file) => {
  try {
    const { text, analysis } = await extractTextFromDocument(file);
    console.log('Extracted text length:', text?.length);
    
    // Parse the analysis text to extract structured information
    const parsedAnalysis = parseAnalysisResults(analysis.analysisText || analysis);
    
    console.log('Parsed analysis:', parsedAnalysis);
    
    // Format the results for display
    const formattedResults = {
      fileName: file.name,
      fileType: file.type,
      analysis: {
        originalText: text,
        primaryCrime: parsedAnalysis.crimeIdentified || analysis.primaryCrime || 'Unknown Crime',
        sections: parsedAnalysis.ipcSections.length > 0 ? parsedAnalysis.ipcSections : 
                 (analysis.sections || []).map(section => ({
                   number: section.section,
                   title: section.title || `Section ${section.section}`,
                   definition: section.description || section.definition || 'No description available',
                   punishment: section.punishment || 'Not specified'
                 })),
        evidence: parsedAnalysis.evidence || analysis.evidence || 'No specific evidence provided',
        timestamp: new Date().toISOString()
      }
    };

    return formattedResults;
  } catch (error) {
    console.error(`Error processing document ${file.name}:`, error);
    throw error;
  }
};

// Helper function to extract evidence from Gemini's analysis
const extractEvidenceFromAnalysis = (analysis) => {
  const evidenceMatch = analysis.match(/EVIDENCE:\s*([\s\S]+?)(?=\n\w+:|$)/);
  return evidenceMatch ? evidenceMatch[1].trim() : 'No specific evidence provided';
};

// Add these crime categories and their related terms
const CRIME_CATEGORIES = {
  THEFT: {
    keywords: ['theft', 'steal', 'stolen', 'rob', 'robbery', 'burglary', 'shoplifting', 'loot', 'misappropriation'],
    weight: 5,
    ipcBase: '378'  // Base IPC section for theft
  },
  MURDER: {
    keywords: ['murder', 'kill', 'death', 'homicide', 'fatal', 'deceased', 'dying', 'killed'],
    weight: 5,
    ipcBase: '302'
  },
  ASSAULT: {
    keywords: ['assault', 'attack', 'hit', 'beat', 'injury', 'hurt', 'wound', 'violence'],
    weight: 4,
    ipcBase: '351'
  },
  CHEATING: {
    keywords: ['cheat', 'fraud', 'deceive', 'misrepresent', 'dupe', 'scam', 'fraudulent'],
    weight: 4,
    ipcBase: '420'
  },
  HARASSMENT: {
    keywords: ['harass', 'stalk', 'threaten', 'intimidate', 'bully', 'abuse'],
    weight: 3,
    ipcBase: '354D'
  }
};

// Add this function after processDocument and before handleSubmit
const calculateRelevance = (crimeTypes, snippet) => {
  if (!crimeTypes || !Array.isArray(crimeTypes) || !snippet) {
    return 0;
  }

  try {
    const snippetLower = snippet.toLowerCase();
    let score = 0;
    let maxScore = 0;

    // Check for crime category matches
    crimeTypes.forEach(crime => {
      if (crime.category && snippetLower.includes(crime.category.toLowerCase())) {
        score += 0.4; // High weight for category match
      }
      maxScore += 0.4;

      // Check for evidence matches
      if (crime.evidence) {
        crime.evidence.forEach(evidence => {
          if (snippetLower.includes(evidence.toLowerCase())) {
            score += 0.2; // Medium weight for evidence match
          }
          maxScore += 0.2;
        });
      }
    });

    // Check for IPC-specific terms
    const ipcTerms = ['ipc', 'indian penal code', 'section', 'punishment'];
    ipcTerms.forEach(term => {
      if (snippetLower.includes(term)) {
        score += 0.1; // Additional weight for legal context
        maxScore += 0.1;
      }
    });

    // Normalize score to 0-1 range
    const normalizedScore = maxScore > 0 ? score / maxScore : 0;

    // Apply confidence boost for strong matches
    const confidenceBoost = normalizedScore > 0.7 ? 1.2 : 1;
    
    return Math.min(normalizedScore * confidenceBoost, 1);
  } catch (error) {
    console.error('Error calculating relevance:', error);
    return 0;
  }
};

// Add this function to get the IPC section info URL
const getIPCSectionInfoUrl = (sectionNumber) => {
  // You can add more legal reference websites here
  const legalUrls = {
    default: `https://devgan.in/ipc/section/${sectionNumber}`,
    indianKanoon: `https://indiankanoon.org/search/?formInput=section${sectionNumber}%20of%20indian%20penal%20code`,
    legalService: `https://www.legalserviceindia.com/legal/ipc-section-${sectionNumber}.html`
  };
  
  return legalUrls.default;
};

const CaseDetails = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    documents: [],
    caseType: 'other'
  });
  const [expandedSections, setExpandedSections] = useState({});
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    dateRange: 'all',
    caseType: 'all'
  });
  const [analysisResults, setAnalysisResults] = useState(() => {
    try {
      const savedResults = localStorage.getItem('analysisResults');
      return savedResults ? JSON.parse(savedResults) : [];
    } catch (error) {
      console.error('Error loading saved results:', error);
      return [];
    }
  });
  const [selectedResults, setSelectedResults] = useState(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const { caseId } = useParams();
  const [caseDetails, setCaseDetails] = useState(null);
  const [suggestedLawyers, setSuggestedLawyers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [specialization, setSpecialization] = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Move fetchData outside useEffect and memoize it
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      if (!caseId) {
        console.error('No case ID provided');
        toast.error('Case ID is missing');
        return;
      }

      console.log('Fetching case details for ID:', caseId);

      try {
        // Update the API endpoint to match the backend route
        const response = await axios.get(
          `http://localhost:5000/api/cases/${caseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('Case details response:', response.data);
        
        if (response.data.success) {
          setCaseDetails(response.data.case);
          
          // Only fetch lawyer suggestions if we have an IPC section
          if (response.data.case?.ipcSection) {
            await fetchLawyerSuggestions(response.data.case.ipcSection);
          }
        } else {
          toast.error(response.data.message || 'Failed to fetch case details');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          toast.error('Case not found');
        } else if (err.response?.status === 401) {
          navigate('/login');
        } else {
          toast.error(err.response?.data?.message || 'Failed to fetch case details');
        }
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [caseId, navigate]); // Add dependencies here

  // Update the useEffect to use the memoized fetchData
  useEffect(() => {
    if (caseId) {
      fetchData();
    } else {
      console.warn('No case ID available');
      setLoading(false);
    }
  }, [caseId, fetchData]); // Include fetchData in dependencies

  useEffect(() => {
    if (analysisResults) {
      localStorage.setItem('analysisResults', JSON.stringify(analysisResults));
    }
  }, [analysisResults]);

  useEffect(() => {
    console.log('Analysis results updated:', analysisResults);
  }, [analysisResults]);

  useEffect(() => {
    return () => {
      // Optionally clear results when leaving the page
      // localStorage.removeItem('analysisResults');
    };
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        documents: files
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!formData.documents || formData.documents.length === 0) {
        throw new Error('Please select at least one document');
      }

      console.log('Starting document analysis...');
      
      // Process each file
      const analysisPromises = formData.documents.map(async (file) => {
        try {
          console.log(`Processing file: ${file.name}`);
          const analysisResult = await analyzeWithGemini(null, file);
          return {
            fileName: file.name,
            analysis: analysisResult
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(analysisPromises);
      setAnalysisResults(results);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message);
    } finally {
      const uploadArea = document.querySelector('.upload-area');
      if (uploadArea) {
        uploadArea.classList.remove('loading');
      }
    }
  };

  const getFileIcon = (fileType) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
    return imageTypes.includes(fileType) ? faImage : faFile;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const extractKeyPoints = (description) => {
    // Split into sentences
    const sentences = description.split(/[.!?]+/).filter(s => s.trim());
    
    // Look for important indicators
    const keyPoints = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return (
        lowerSentence.includes('whoever') ||
        lowerSentence.includes('shall be') ||
        lowerSentence.includes('punishable') ||
        lowerSentence.includes('imprisonment') ||
        lowerSentence.includes('according to') ||
        lowerSentence.includes('under this section') ||
        lowerSentence.includes('provided that')
      );
    });

    // Return top 3 key points or all if less than 3
    return keyPoints.slice(0, 3).map(point => point.trim());
  };

  const toggleSectionDescription = async (caseId, section) => {
    const key = `${caseId}-${section}`;
    
    if (!expandedSections[key]) {
      try {
        setExpandedSections(prev => ({
          ...prev,
          [key]: 'Loading...'
        }));

        const searchQuery = `IPC Section ${section} Indian Penal Code explanation punishment`;
        const response = await axios.get(
          `https://api.bing.microsoft.com/v7.0/search`,
          {
            params: {
              q: searchQuery
            },
            headers: {
              'Ocp-Apim-Subscription-Key': '21f82301b9544a57bd153b1b4d7f3a03'
            }
          }
        );

        if (response.data?.webPages?.value) {
          // Get the full description
          const fullDescription = response.data.webPages.value
            .slice(0, 2)
            .map(page => page.snippet)
            .join(' ');

          // Extract key points
          const keyPoints = extractKeyPoints(fullDescription);

          // Format the content
          const formattedContent = {
            description: fullDescription,
            keyPoints: keyPoints
          };

          setExpandedSections(prev => ({
            ...prev,
            [key]: formattedContent
          }));
        } else {
          throw new Error('No search results found');
        }
      } catch (error) {
        console.error('Error fetching section description:', error);
        setExpandedSections(prev => ({
          ...prev,
          [key]: {
            description: `Error: Failed to load description for Section ${section}. Please try again later.`,
            keyPoints: []
          }
        }));
        toast.error('Failed to load section description');
      }
    } else {
      const newExpandedSections = { ...expandedSections };
      delete newExpandedSections[key];
      setExpandedSections(newExpandedSections);
    }
  };

  const handleIPCSectionClick = (sectionNum, result) => {
    try {
      // Get the crime type from the result
      const crimeType = result?.parsedAnalysis?.crimeIdentified || 
                       result?.analysis?.parsedAnalysis?.crimeIdentified;

      // Determine specialization based on IPC section ranges and crime type
      let specialization;
      
      // First check if section exists in the IPC_SPECIALIZATION_MAP
      if (IPC_SPECIALIZATION_MAP[sectionNum]) {
        specialization = IPC_SPECIALIZATION_MAP[sectionNum].specialization;
      } else {
        // If not in map, determine by section ranges
        const section = parseInt(sectionNum);
        
        if (section >= 378 && section <= 462) {
          specialization = 'Criminal Law'; // Property crimes including theft
        } else if (section >= 299 && section <= 377) {
          specialization = 'Criminal Law'; // Offenses against human body
        } else if (section >= 268 && section <= 294) {
          specialization = 'Environmental Law'; // Public nuisance and health
        } else if (section >= 463 && section <= 489) {
          specialization = 'Civil Law'; // Forgery and property documents
        } else if (section >= 493 && section <= 498) {
          specialization = 'Family Law'; // Marriage related offenses
        } else {
          // Fallback based on crime type
          specialization = 
            crimeType?.toLowerCase().includes('theft') ? 'Criminal Law' :
            crimeType?.toLowerCase().includes('murder') ? 'Criminal Law' :
            crimeType?.toLowerCase().includes('environment') ? 'Environmental Law' :
            crimeType?.toLowerCase().includes('property') ? 'Civil Law' :
            crimeType?.toLowerCase().includes('family') ? 'Family Law' : 'General Practice';
        }
      }

      console.log(`Navigating to FindLawyers with IPC section ${sectionNum} (${specialization})`);
      
      navigate('/client/find-lawyers', { 
        state: { 
          ipcSection: sectionNum,
          specialization: specialization,
          crimeType: crimeType,
          caseDetails: {
            title: result?.fileName || 'Case Analysis',
            description: result?.description || 'IPC Section Analysis',
            analysisResults: [result]
          }
        } 
      });
    } catch (error) {
      console.error('Error handling IPC section click:', error);
      toast.error('Failed to navigate to lawyers page');
    }
  };

  const getFilteredCases = () => {
    return cases.filter(caseItem => {
      // Add console.log to debug filtering
      console.log('Filtering case:', {
        caseType: caseItem.caseType,
        filterType: filterOptions.caseType,
        matches: filterOptions.caseType === 'all' || caseItem.caseType === filterOptions.caseType
      });

      // Filter by status
      if (filterOptions.status !== 'all' && caseItem.status !== filterOptions.status) {
        return false;
      }

      // Filter by case type
      if (filterOptions.caseType !== 'all' && caseItem.caseType !== filterOptions.caseType) {
        return false;
      }

      // Filter by date range
      if (filterOptions.dateRange !== 'all') {
        const caseDate = new Date(caseItem.createdAt);
        const today = new Date();
        
        switch (filterOptions.dateRange) {
          case 'today':
            return caseDate.toDateString() === today.toDateString();
          case 'week':
            const weekAgo = new Date(today.setDate(today.getDate() - 7));
            return caseDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
            return caseDate >= monthAgo;
          default:
            return true;
        }
      }
      
      return true;
    });
  };

  const handleDeleteCase = async (caseId) => {
    try {
      await api.delete(`/cases/${caseId}`);
      toast.success('Case deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error(error.response?.data?.message || 'Failed to delete case');
    }
  };

  const handleDeleteAnalysis = async (index) => {
    try {
      const sortedResults = [...analysisResults].sort((a, b) => {
        const timeA = a.timestamp || '0';
        const timeB = b.timestamp || '0';
        return timeB.localeCompare(timeA);
      });
      
      const resultToDelete = sortedResults[index];
      const originalIndex = analysisResults.findIndex(r => 
        r.fileName === resultToDelete.fileName && r.timestamp === resultToDelete.timestamp
      );

      const response = await api.post('/cases', {
        title: resultToDelete.fileName || 'Untitled Analysis',
        description: 'Analysis result moved to deleted cases',
        documents: [
          {
            fileName: resultToDelete.fileName || 'analysis.txt',
            extractedText: resultToDelete.analysis?.text || JSON.stringify(resultToDelete),
            fileType: 'text/plain',
            uploadDate: new Date()
          }
        ],
        caseType: formData.caseType || 'other',
        ipcSection: resultToDelete.sections?.[0]?.section || null,
        ipcDescription: resultToDelete.sections?.[0]?.description || '',
        relatedSections: resultToDelete.sections?.slice(1).map(section => ({
          section: section.section,
          confidence: calculateSectionConfidence(section, resultToDelete.analysis),
          description: section.description
        })) || [],
        isDeleted: true,
        analysisResults: resultToDelete
      });

      if (response.data) {
        // Remove from current analysis results
        setAnalysisResults(prevResults => 
          prevResults.filter((_, index) => index !== originalIndex)
        );
        
        // Update localStorage
        const updatedResults = analysisResults.filter((_, index) => index !== originalIndex);
        localStorage.setItem('analysisResults', JSON.stringify(updatedResults));
        
        toast.success('Analysis moved to deleted cases');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete analysis');
      }
    }
  };

  const calculateSectionConfidence = (section, analysis) => {
    let confidence = section.confidence || 0;
    
    // Adjust confidence based on analysis results
    if (analysis) {
      // Check if section keywords appear in key terms
      const keyTermsMatch = analysis.crimeTypes?.some(term => 
        section.description?.toLowerCase().includes(term.category.toLowerCase())
      );
      if (keyTermsMatch) confidence += 0.2;

      // Check for crime type match
      const crimeTypeMatch = analysis.crimeTypes?.some(term =>
        section.description?.toLowerCase().includes(term.category.toLowerCase())
      );
      if (crimeTypeMatch) confidence += 0.3;
    }

    // Normalize confidence to be between 0 and 1
    return Math.min(Math.max(confidence, 0.1), 1);
  };

  const handleDeleteSelected = async () => {
    if (selectedResults.size === 0) {
      toast.warning('Please select items to delete');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to move ${selectedResults.size} selected items to deleted cases?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const sortedResults = [...analysisResults].sort((a, b) => {
        const timeA = a.timestamp || '0';
        const timeB = b.timestamp || '0';
        return timeB.localeCompare(timeA);
      });

      const selectedIndexes = Array.from(selectedResults);
      const deletePromises = selectedIndexes.map(async (id) => {
        const resultToDelete = sortedResults.find(result => result._id === id);
        
        // Create a document object with the analysis content
        const documentContent = {
          fileName: resultToDelete.fileName || 'analysis.txt',
          extractedText: resultToDelete.analysis?.text || JSON.stringify(resultToDelete),
          fileType: 'text/plain'
        };

        // Create the case data with required fields
        const caseData = {
          title: resultToDelete.fileName || 'Untitled Analysis',
          description: 'Analysis result moved to deleted cases',
          caseType: formData.caseType || 'other',
          documents: [documentContent],
          ipcSection: resultToDelete.sections?.[0]?.section || null,
          ipcDescription: resultToDelete.sections?.[0]?.description || '',
          relatedSections: resultToDelete.sections?.slice(1).map(section => ({
            section: section.section,
            confidence: calculateSectionConfidence(section, resultToDelete.analysis),
            description: section.description
          })) || [],
          isDeleted: true,
          analysisResults: resultToDelete
        };

        return api.post('/cases', caseData);
      });

      await Promise.all(deletePromises);

      // Update the analysis results by removing the selected items
      setAnalysisResults(prevResults => 
        prevResults.filter(result => !selectedResults.has(result._id))
      );

      // Clear the selection
      setSelectedResults(new Set());
      
      // Update localStorage
      const updatedResults = analysisResults.filter(result => !selectedResults.has(result._id));
      localStorage.setItem('analysisResults', JSON.stringify(updatedResults));

      toast.success(`Successfully moved ${selectedResults.size} items to deleted cases`);
    } catch (error) {
      console.error('Error deleting selected analyses:', error);
      toast.error(error.response?.data?.message || 'Failed to delete some analyses');
    } finally {
      setLoading(false);
    }
  };

  const toggleResultSelection = (result) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(result._id)) {
        newSet.delete(result._id);
      } else {
        newSet.add(result._id);
      }
      return newSet;
    });
  };

  const handleDeleteResults = (index) => {
    try {
      setAnalysisResults(prevResults => {
        const newResults = prevResults.filter((_, i) => i !== index);
        localStorage.setItem('analysisResults', JSON.stringify(newResults));
        toast.success('Analysis result deleted successfully');
        return newResults;
      });
    } catch (error) {
      console.error('Error deleting result:', error);
      toast.error('Failed to delete result');
    }
  };

  const handleDeleteAllResults = () => {
    try {
      setAnalysisResults([]);
      localStorage.removeItem('analysisResults');
      toast.success('All analysis results cleared');
    } catch (error) {
      console.error('Error clearing results:', error);
      toast.error('Failed to clear results');
    }
  };

  const handleIPCSectionInfoClick = async (section) => {
    try {
      // Show loading state
      toast.info('Opening IPC section details...');
      
      // Primary source
      window.open(`https://devgan.in/ipc/section/${section.section}/`, '_blank');
      
      // Fallback sources if needed
      const fallbackUrls = [
        `https://indiankanoon.org/search/?formInput=section%20${section.section}%20indian%20penal%20code`,
        `https://www.indiacode.nic.in/handle/123456789/2263/simple-search?query=section+${section.section}`
      ];
      
    } catch (error) {
      console.error('Error opening section details:', error);
      toast.error('Failed to open section details. Please try again.');
    }
  };

  const handleToggleSection = (index) => {
    setExpandedSections(prev => {
      const newExpandedSections = { ...prev };
      newExpandedSections[index] = !newExpandedSections[index];
      return newExpandedSections;
    });
  };

  const renderIpcSections = (result) => {
    console.log("Rendering IPC sections for:", result);
    
    // Check if we have parsed sections from our frontend parser
    let sections = result.parsedAnalysis?.ipcSections || [];
    
    // If no sections from our parser, try the backend parsed sections
    if (!sections || sections.length === 0) {
      sections = result.analysis?.parsedAnalysis?.ipcSections || [];
    }
    
    console.log("Sections to render:", sections);
    
    if (!sections || sections.length === 0 || 
        (sections.length === 1 && (sections[0] === 'Unable to determine' || sections[0].number === 'Unknown'))) {
      return (
        <div className="alert alert-warning text-center">
          <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
          No IPC sections identified in this document
        </div>
      );
    }
    
    return (
      <div className="section-list">
        {sections.map((section, sectionIndex) => {
          const sectionNum = section.number;
          return (
            <div key={`section-${sectionIndex}`} className="section-item mb-3 p-3 border rounded shadow-sm">
              <div className="section-header d-flex justify-content-between align-items-center mb-2">
                <span 
                  className="section-number badge bg-danger fs-5 p-2 me-2"
                  onClick={() => handleIPCSectionClick(sectionNum, result)}
                  style={{ cursor: 'pointer' }}
                >
                  Section {sectionNum}
                </span>
                <span className="section-title fs-5 fw-bold">{section.title || IPC_SECTIONS[sectionNum]?.title || ''}</span>
              </div>
              
              <div className="section-details mt-3">
                {section.description && (
                  <p className="mb-2"><strong>Description:</strong> {section.description}</p>
                )}
                {IPC_SECTIONS[sectionNum] && (
                  <div className="row">
                    <div className="col-md-8">
                      <p className="mb-2"><strong>Definition:</strong> {IPC_SECTIONS[sectionNum].definition}</p>
                      <p className="mb-2"><strong>Punishment:</strong> {IPC_SECTIONS[sectionNum].punishment}</p>
                      {IPC_SECTIONS[sectionNum].explanation && (
                        <p className="mb-2"><strong>Explanation:</strong> {IPC_SECTIONS[sectionNum].explanation}</p>
                      )}
                    </div>
                    <div className="col-md-4 text-center">
                      <button 
                        className="btn btn-primary mt-2 view-lawyers-btn"
                        onClick={() => handleIPCSectionClick(sectionNum, result)}
                        disabled={loadingSuggestions}
                      >
                        {loadingSuggestions ? (
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        ) : (
                          <FontAwesomeIcon icon={faUserTie} className="me-2" />
                        )}
                        View Specialized Lawyers
                      </button>
                    </div>
                  </div>
                )}
                {!section.description && !IPC_SECTIONS[sectionNum] && (
                  <div className="row">
                    <div className="col-md-8">
                      <p className="text-muted">No detailed information available for this section.</p>
                    </div>
                    <div className="col-md-4 text-center">
                      <button 
                        className="btn btn-outline-primary mt-2 view-lawyers-btn"
                        onClick={() => handleIPCSectionClick(sectionNum, result)}
                        disabled={loadingSuggestions}
                      >
                        {loadingSuggestions ? (
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        ) : (
                          <FontAwesomeIcon icon={faUserTie} className="me-2" />
                        )}
                        View Lawyers for Section {sectionNum}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnalysisAndCasesList = () => {
    // Filter cases based on filter options
    const filteredCases = cases.filter(caseItem => {
      if (filterOptions.caseType !== 'all' && caseItem.caseType !== filterOptions.caseType) return false;
      if (filterOptions.status !== 'all' && caseItem.status !== filterOptions.status) return false;
      // Add more filters as needed
      return true;
    });

    return (
      <div className="analysis-results-container">
        {/* Analysis Results */}
        {analysisResults.length > 0 && (
          <div className="analysis-results mb-4">
            <h4>Document Analysis Results</h4>
            <div className="results-list">
              {analysisResults.map((result, index) => (
                <div key={`analysis-${index}`} className="analysis-item">
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">
                          {result.fileName || 'Document Analysis'}
                        </h5>
                        <small className="text-muted">
                          {new Date(result.createdAt || Date.now()).toLocaleString()}
                        </small>
                      </div>
                      <div>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleToggleSection(index)}
                        >
                          <FontAwesomeIcon 
                            icon={expandedSections[index] ? faChevronUp : faChevronDown} 
                          />
                        </button>
                      </div>
                    </div>
                    
                    {expandedSections[index] && (
                      <div className="card-body">
                        {/* Crime Identification Section */}
                        <div className="crime-identification mb-3">
                          <h5 className="analysis-subtitle">
                            <FontAwesomeIcon icon={faGavel} className="me-2" />
                            Crime Identified
                          </h5>
                          <div className="crime-badge">
                            {result.parsedAnalysis?.crimeIdentified ? (
                              <span className={`badge ${
                                result.parsedAnalysis.crimeIdentified.includes('Unable') ? 
                                'bg-secondary' : 'bg-danger'
                              } fs-6 p-2`}>
                                {result.parsedAnalysis.crimeIdentified}
                              </span>
                            ) : result.analysis?.parsedAnalysis?.crimeIdentified ? (
                              <span className={`badge ${
                                result.analysis.parsedAnalysis.crimeIdentified.includes('Unable') ? 
                                'bg-secondary' : 'bg-danger'
                              } fs-6 p-2`}>
                                {result.analysis.parsedAnalysis.crimeIdentified}
                              </span>
                            ) : (
                              <span className="badge bg-secondary fs-6 p-2">
                                No crime identified
                              </span>
                            )}
                          </div>
                        </div>

                        {/* IPC Sections - Enhanced and Focused Display */}
                        <div className="ipc-sections mb-4">
                          <h5 className="analysis-subtitle text-center mb-3">
                            <FontAwesomeIcon icon={faGavel} className="me-2" />
                            Applicable IPC Sections
                          </h5>
                          
                          {renderIpcSections(result)}
                        </div>

                        {/* Evidence Section */}
                        {(result.parsedAnalysis?.evidence?.length > 0 || result.analysis?.parsedAnalysis?.evidence?.length > 0) && (
                          <div className="evidence-section mb-3">
                            <h5 className="analysis-subtitle">
                              <FontAwesomeIcon icon={faCheck} className="me-2" />
                              Key Evidence
                            </h5>
                            <ul className="evidence-list">
                              {(result.parsedAnalysis?.evidence || result.analysis?.parsedAnalysis?.evidence || []).map((item, i) => (
                                <li key={`evidence-${i}`} className="mb-1">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* View Full Analysis Button */}
                        <div className="text-center mt-4">
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target={`#fullAnalysis${index}`} 
                            aria-expanded="false" 
                            aria-controls={`fullAnalysis${index}`}
                          >
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                            View Full Analysis
                          </button>
                          <div className="collapse mt-3" id={`fullAnalysis${index}`}>
                            <div className="card card-body">
                              <pre className="bg-light p-3" style={{whiteSpace: 'pre-wrap'}}>
                                {result.analysis?.rawAnalysis || JSON.stringify(result.analysis, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Rest of your existing code for filtered cases */}
        {filteredCases.length > 0 ? (
          filteredCases.map((caseItem) => (
            <div key={`summary-${caseItem._id}`} className="analysis-card mb-3">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-3">Analysis Summary</h5>
                    <span className="case-type-badge">{caseItem.caseType}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <small className="me-3">{new Date(caseItem.createdAt).toLocaleDateString()}</small>
                    <button
                      className="btn btn-link text-danger delete-btn"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this case?')) {
                          handleDeleteCase(caseItem._id);
                        }
                      }}
                      title="Delete case"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {/* Debug information */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info mb-3" style={{color: '#666', fontSize: '0.8em'}}>
                      <div>Has IPC Section: {caseItem.ipcSection ? 'Yes' : 'No'}</div>
                      <div>IPC Section: {caseItem.ipcSection || 'None'}</div>
                      <div>Related Sections: {caseItem.relatedSections?.length || 0}</div>
                    </div>
                  )}

                  {/* Key Findings Section */}
                  <div className="key-findings">
                    {/* Primary IPC Section */}
                    {caseItem.ipcSection && caseItem.ipcSection !== 'null' && (
                      <div className="primary-finding">
                        <div 
                          className="highlight-badge"
                          onClick={() => handleIPCSectionClick(caseItem.ipcSection, caseItem)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view detailed IPC section information"
                        >
                          <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
                          Primary IPC Section: {caseItem.ipcSection}
                        </div>
                        {caseItem.ipcDescription && caseItem.ipcDescription !== 'null' && (
                          <div className="finding-description">
                            {caseItem.ipcDescription}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Related IPC Sections */}
                    {Array.isArray(caseItem.relatedSections) && caseItem.relatedSections.length > 0 && (
                      <div className="related-findings mt-4">
                        <h6>Related Sections:</h6>
                        <div className="related-sections-list">
                          {caseItem.relatedSections.map((related, index) => (
                            <div key={index} className="related-section-item">
                              <div className="section-header">
                                <span 
                                  className="finding-chip"
                                  onClick={() => handleIPCSectionClick(related.section, caseItem)}
                                  style={{ cursor: 'pointer' }}
                                  title="Click to view detailed IPC section information"
                                >
                                  Section {related.section}
                                </span>
                                <span className="confidence-badge">
                                  {Math.round(related.confidence * 100)}% relevant
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence Context */}
                    {Array.isArray(caseItem.evidenceContext) && caseItem.evidenceContext.length > 0 && (
                      <div className="key-evidence mt-4">
                        <h6>Key Evidence Points:</h6>
                        <ul className="evidence-points">
                          {caseItem.evidenceContext.map((evidence, index) => (
                            <li key={index} className="evidence-point">
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Document List */}
                  <div className="documents-list mt-4">
                    <h6>Analyzed Documents:</h6>
                    <div className="document-chips">
                      {caseItem.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={`http://localhost:5000/${doc.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-chip"
                        >
                          <FontAwesomeIcon 
                            icon={getFileIcon(doc.fileType)} 
                            className="me-2"
                          />
                          {doc.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-cases-message">
            <p>No cases found matching the selected filters.</p>
          </div>
        )}
      </div>
    );
  };

  const fetchLawyerSuggestions = async (ipcSection) => {
    try {
      setLoadingSuggestions(true);
      const response = await api.get(`/cases/suggest-lawyers/${caseId}`);
      setSuggestedLawyers(response.data.lawyers);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching lawyer suggestions:', error);
      toast.error('Failed to fetch lawyer suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const renderLawyerSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <div className="lawyer-suggestions-container">
        <div className="suggestions-header">
          <h3>Recommended Lawyers</h3>
          {matchInfo && (
            <div className="match-info">
              <p>Specialization: <strong>{specialization}</strong></p>
              <p>Case Type: <strong>{matchInfo.subType}</strong></p>
            </div>
          )}
        </div>

        {loadingSuggestions ? (
          <div className="loading-spinner">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Finding the best lawyers for your case...</p>
          </div>
        ) : suggestedLawyers.length > 0 ? (
          <div className="lawyers-grid">
            {suggestedLawyers.map((lawyer) => (
              <div key={lawyer._id} className="lawyer-card">
                <div className="lawyer-header">
                  <div className="lawyer-avatar">
                    {lawyer.profilePicture ? (
                      <img 
                        src={lawyer.profilePicture} 
                        alt={lawyer.fullName}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.png'; // Fallback image
                        }}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {lawyer.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="lawyer-info">
                    <h4>{lawyer.fullName}</h4>
                    <div className="specialization-badge">
                      {lawyer.specialization}
                      {lawyer.expertise?.includes(matchInfo.subType) && (
                        <span className="expertise-match">
                          Expert in {matchInfo.subType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="lawyer-details">
                  <p className="experience">
                    <FontAwesomeIcon icon={faBriefcase} className="icon" />
                    <span className="label">Experience:</span> 
                    {lawyer.yearsOfExperience} years
                  </p>
                  <p className="expertise">
                    <FontAwesomeIcon icon={faGavel} className="icon" />
                    <span className="label">Expertise:</span> 
                    {lawyer.expertise?.join(', ') || 'General Practice'}
                  </p>
                  <p className="fees">
                    <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                    <span className="label">Consultation Fee:</span> 
                    ₹{lawyer.consultationFees || 'Not specified'}
                  </p>
                  {lawyer.rating && (
                    <p className="rating">
                      <FontAwesomeIcon icon={faStar} className="icon" />
                      <span className="label">Rating:</span> 
                      <span className="stars">{'⭐'.repeat(Math.round(lawyer.rating))}</span>
                      <span>({lawyer.rating.toFixed(1)})</span>
                    </p>
                  )}
                </div>
                <div className="lawyer-actions">
                  <Link 
                    to={`/book-appointment/${lawyer._id}`}
                    className="book-btn"
                  >
                    <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
                    Book Consultation
                  </Link>
                  <Link 
                    to={`/lawyer-profile/${lawyer._id}`}
                    className="view-profile-btn"
                  >
                    <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                    View Full Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-lawyers-message">
            <FontAwesomeIcon icon={faUserTie} size="2x" className="mb-3" />
            <h4>No Matching Lawyers Found</h4>
            <p>We couldn't find any lawyers specializing in {specialization} at the moment.</p>
          </div>
        )}
      </div>
    );
  };

  const handleFindLawyersButtonClick = (caseItem) => {
    try {
      const section = caseItem.ipcSection;
      const crimeType = caseItem.analysisResults?.crimeIdentified;
      const specialization = EXTENDED_IPC_MAP[section] || 
        (crimeType === 'Environmental Pollution' ? 'Environmental Law' :
         crimeType === 'Criminal' ? 'Criminal Law' :
         crimeType === 'Property' ? 'Real Estate Law' :
         crimeType === 'Civil' ? 'Civil Law' :
         crimeType === 'Family' ? 'Family Law' : 'General Practice');
      
      if (!section && !crimeType) {
        toast.warning('No IPC section or crime type identified for this case');
        return;
      }
      
      navigate('/client/find-lawyers', {
        state: { 
          ipcSection: section,
          specialization: specialization,
          crimeType: crimeType,
          caseDetails: {
            id: caseItem._id,
            title: caseItem.title,
            description: caseItem.description,
            analysisResults: caseItem.analysisResults
          }
        }
      });
    } catch (error) {
      console.error('Error navigating to find lawyers:', error);
      toast.error('Failed to navigate to find lawyers page');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div className="main">
        <ClientSidebar />
        <div className="content">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="filter-section">
              <div className="filter-container">
                <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                <select
                  className="filter-select"
                  value={filterOptions.caseType}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    caseType: e.target.value
                  }))}
                >
                  <option value="all">All Types</option>
                  <option value="criminal">Criminal</option>
                  <option value="civil">Civil</option>
                  <option value="family">Family</option>
                  <option value="corporate">Corporate</option>
                  <option value="other">Other</option>
                </select>
                <select
                  className="filter-select"
                  value={filterOptions.status}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  className="filter-select"
                  value={filterOptions.dateRange}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    dateRange: e.target.value
                  }))}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>
            </div>
            <Link 
              to="/deleted-cases" 
              className="btn btn-outline-danger deleted-cases-btn"
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              View Deleted Cases
            </Link>
          </div>
          <div className="container-fluid p-4">
            {/* Upload Section */}
            <div className="upload-section-container">
              <div className="card upload-card">
                <div className="card-body text-center">
                  <FontAwesomeIcon icon={faUpload} size="2x" className="text-primary mb-3" />
                  <h5>Upload Case Documents</h5>
                  <form onSubmit={handleSubmit}>
                    <div className="upload-area">
                      <input
                        type="file"
                        className="form-control mb-3"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                      <small className="text-muted d-block mb-3">
                        Supported formats: PDF, Word, Text, Images (JPG, PNG, GIF)
                      </small>
                      <select
                        className="form-control mb-3"
                        value={formData.caseType}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          caseType: e.target.value
                        }))}
                      >
                        <option value="criminal">Criminal</option>
                        <option value="civil">Civil</option>
                        <option value="family">Family</option>
                        <option value="corporate">Corporate</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {formData.documents.length > 0 && (
                      <div className="selected-files mt-3">
                        <h6>Selected Files:</h6>
                        <div className="file-list">
                          {Array.from(formData.documents).map((file, index) => (
                            <div key={index} className="file-item">
                              <FontAwesomeIcon 
                                icon={file.type.startsWith('image/') ? faImage : faFile} 
                                className="me-2"
                              />
                              <span>{file.name}</span>
                              <small className="text-muted ms-2">
                                ({formatFileSize(file.size)})
                              </small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="alert alert-danger mt-3" role="alert">
                        {typeof error === 'string' ? error : (
                          <div className="error-content">
                            {error}
                          </div>
                        )}
                      </div>
                    )}
                    <button 
                      type="submit" 
                      className="btn btn-primary mt-3"
                      disabled={loading || !formData.documents.length}
                    >
                      {loading ? (
                        <><FontAwesomeIcon icon={faSpinner} spin /> Analyzing...</>
                      ) : (
                        'Analyze Documents'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {renderAnalysisAndCasesList()}

            {/* Lawyer Suggestions Section */}
            {renderLawyerSuggestions()}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default CaseDetails; 