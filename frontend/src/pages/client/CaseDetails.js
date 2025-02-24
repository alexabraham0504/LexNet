import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFile, faSpinner, faImage, faExclamationCircle, faChevronDown, faChevronUp, faFilter, faTrash, faInfoCircle, faUserTie, faCalendarPlus, faUserCircle, faGavel, faExternalLink, faEye, faBriefcase, faMoneyBill, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';
import Footer from '../../components/footer/footer-admin';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import './CaseDetails.css';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';

// Set PDF.js workerSrc
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const LEGAL_KEYWORDS = [
  'section', 'act', 'court', 'judgment', 'petition', 'plaintiff', 'defendant',
  'prosecution', 'accused', 'witness', 'evidence', 'hearing', 'trial',
  'appeal', 'jurisdiction', 'law', 'legal', 'criminal', 'civil', 'judge',
  'magistrate', 'advocate', 'complaint', 'case', 'ipc', 'penal', 'code'
];

const validateLegalContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Convert to lowercase and split into words
  const words = text.toLowerCase().split(/\W+/);
  const uniqueWords = new Set(words);
  
  // Count legal keywords
  const legalTermCount = LEGAL_KEYWORDS.reduce((count, keyword) => {
    return uniqueWords.has(keyword) ? count + 1 : count;
  }, 0);
  
  // Calculate percentage of legal terms (minimum 3 terms)
  return legalTermCount >= 3;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Constants
const BING_API_KEY = "21f82301b9544a57bd153b1b4d7f3a03";
const GOOGLE_CLOUD_API_KEY = 'AIzaSyBLSAPqtZQ4KhCTNP9zkM2Dke9giqwhENc';

// Add Gemini API constant
const GEMINI_API_KEY = 'AIzaSyBLSAPqtZQ4KhCTNP9zkM2Dke9giqwhENc';

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

// Add this mapping at the top of the file
const IPC_SPECIALIZATION_MAP = {
  // Environmental Laws
  '268': 'Environmental Law',
  '269': 'Environmental Law',
  '277': 'Environmental Law',
  '278': 'Environmental Law',
  
  // Criminal Laws
  '302': 'Criminal Law',
  '303': 'Criminal Law',
  '304': 'Criminal Law',
  '307': 'Criminal Law',
  '324': 'Criminal Law',
  '325': 'Criminal Law',
  '326': 'Criminal Law',
  '354': 'Criminal Law',
  '376': 'Criminal Law',
  '378': 'Criminal Law',
  '379': 'Criminal Law',
  '380': 'Criminal Law',
  '392': 'Criminal Law',
  '396': 'Criminal Law',
  '420': 'Criminal Law',
  '499': 'Criminal Law',
  '500': 'Criminal Law',
  
  // Civil Laws
  '406': 'Civil Law',
  '415': 'Civil Law',
  '418': 'Civil Law',
  
  // Family Laws
  '494': 'Family Law',
  '495': 'Family Law',
  '496': 'Family Law',
  '498A': 'Family Law'
};

const extractTextFromDocument = async (file) => {
  try {
    let extractedText = '';

    if (file.type === 'application/pdf') {
      try {
        console.log('Processing PDF:', file.name);
        
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document using pdf.js
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        console.log('PDF loaded, pages:', pdf.numPages);
        
        // Extract text from all pages
        const textContent = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          textContent.push(pageText);
        }

        extractedText = textContent.join('\n');
        
        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('No text content found in PDF');
        }

        console.log('Successfully extracted text from PDF:', 
          extractedText.substring(0, 200) + '...');

      } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    } 
    else if (file.type.includes('image')) {
      // Keep existing image handling code
      const reader = new FileReader();
      extractedText = await new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64Image = e.target.result.split(',')[1];
            const response = await axios.post(
              `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`,
              {
                requests: [{
                  image: { content: base64Image },
                  features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
                }]
              }
            );
            resolve(response.data.responses[0]?.fullTextAnnotation?.text || '');
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    console.log('Extracted text:', extractedText.substring(0, 200) + '...');

    // Send extracted text to Gemini for analysis
    const geminiResponse = await analyzeWithGemini(extractedText);
    
    return {
      text: extractedText,
      analysis: geminiResponse
    };

  } catch (error) {
    console.error('Error in extractTextFromDocument:', error);
    throw error;
  }
};

// Update the analyzeWithGemini function to better handle the extracted text
const analyzeWithGemini = async (text) => {
  try {
    const prompt = `
      You are a legal expert specializing in Indian Criminal Law. 
      Analyze this text and provide detailed information:

      TEXT TO ANALYZE:
      "${text}"

      Please provide your analysis in this exact format:

      CRIME IDENTIFIED:
      [Main crime identified from the text]

      IPC SECTIONS APPLICABLE:
      Section [number]: [section title]

      SECTION DETAILS:
      Definition: [Official IPC section definition]
      Key Elements: 
      - [List key components of the offense]
      - [What must be proved]
      Punishment: [Prescribed punishment]

      EVIDENCE FROM TEXT:
      [Quote relevant parts from the input text that support the crime identification]

      ANALYSIS:
      [Explain how the evidence matches this section]

      SEVERITY: [High/Medium/Low]
      CATEGORY: [Crime category]
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze text with Gemini');
  }
};

// Add a function to parse and format the analysis results
const parseAnalysisResults = (analysisText) => {
  const sections = {
    crimeIdentified: analysisText.match(/CRIME IDENTIFIED:\s*([\s\S]*?)(?=\n\n|$)/)?.[1]?.trim(),
    ipcSections: [],
    evidence: analysisText.match(/EVIDENCE ANALYSIS:\s*([\s\S]*?)(?=\n\n|$)/)?.[1]?.trim(),
    legalReasoning: analysisText.match(/LEGAL REASONING:\s*([\s\S]*?)(?=\n\n|$)/)?.[1]?.trim(),
  };

  // Extract IPC sections and their details
  const ipcSectionMatches = analysisText.matchAll(/Section (\d+):[^\n]*\n\nSECTION DETAILS:\s*([\s\S]*?)(?=\n\nEVIDENCE|$)/g);
  for (const match of ipcSectionMatches) {
    const sectionNumber = match[1];
    const sectionDetails = match[2];
    
    sections.ipcSections.push({
      number: sectionNumber,
      title: sectionDetails.match(/Definition:\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
      definition: sectionDetails.match(/Definition:\s*([\s\S]*?)(?=\nKey Elements|$)/)?.[1]?.trim(),
      keyElements: sectionDetails.match(/Key Elements:\s*([\s\S]*?)(?=\nPunishment|$)/)?.[1]?.trim(),
      punishment: sectionDetails.match(/Punishment:\s*([\s\S]*?)(?=\nNotable Cases|$)/)?.[1]?.trim(),
      notableCases: sectionDetails.match(/Notable Cases:\s*([\s\S]*?)(?=\n\n|$)/)?.[1]?.trim()
    });
  }

  return sections;
};

// Update the processDocument function
const processDocument = async (file) => {
  try {
    const { text, analysis } = await extractTextFromDocument(file);
    const userId = sessionStorage.getItem("userid");
    const token = sessionStorage.getItem("token");

    if (!userId || !token) {
      throw new Error("Authentication required");
    }

    // Create case data with analysis results
    const caseData = {
      clientId: userId,
      title: file.name,
      description: "Document analysis results",
      documents: [{
        fileName: file.name,
        fileType: file.type,
        extractedText: text,
        uploadDate: new Date()
      }],
      status: 'pending',
      caseType: 'other',
      analysisResults: analysis,
      ipcSection: analysis.sections?.[0]?.number || null,
      ipcDescription: analysis.sections?.[0]?.definition || null,
      relatedSections: analysis.sections?.map(section => ({
        section: section.number,
        confidence: section.confidence || 0.5
      })) || []
    };

    // Save to database
    const response = await axios.post(
      'http://localhost:5000/api/cases',
      caseData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      toast.success('Analysis saved successfully');
      return response.data.case;
    } else {
      throw new Error(response.data.message || 'Failed to save analysis');
    }
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

// Helper function can stay outside the component
const cleanupOldAnalysis = () => {
  try {
    const savedResults = JSON.parse(localStorage.getItem('analysisResults') || '[]');
    // Keep only last 10 analyses
    const recentResults = savedResults.slice(-10);
    localStorage.setItem('analysisResults', JSON.stringify(recentResults));
  } catch (error) {
    console.error('Error cleaning up analysis results:', error);
    localStorage.removeItem('analysisResults');
  }
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userId = sessionStorage.getItem("userid");
        
        if (!token || !userId) {
          toast.error('Authentication required. Please login again.');
          navigate('/login');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Fetch all cases for the client
        const casesResponse = await axios.get(
          `http://localhost:5000/api/cases/client/${userId}`,
          config
        );

        if (casesResponse.data.success) {
          setCases(casesResponse.data.cases);
          
          if (caseId) {
            const selectedCase = casesResponse.data.cases.find(c => c._id === caseId);
            if (selectedCase) {
              setCaseDetails(selectedCase);
            } else {
              toast.error('Case not found');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        handleError(error);
      }
    };

    fetchData();
  }, [caseId, navigate]);

  useEffect(() => {
    if (analysisResults) {
      localStorage.setItem('analysisResults', JSON.stringify(analysisResults));
    }
  }, [analysisResults]);

  useEffect(() => {
    console.log('Analysis results updated:', analysisResults);
  }, [analysisResults]);

  useEffect(() => {
    cleanupOldAnalysis();
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
    
    // Add loading class to upload area instead of setting global loading state
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
      uploadArea.classList.add('loading');
    }
    
    setError(null);
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      if (!formData.documents || formData.documents.length === 0) {
        throw new Error('Please select at least one document');
      }

      console.log('Starting document analysis...');
      
      // Process each file
      const analysisPromises = formData.documents.map(async (file) => {
        try {
          console.log(`Processing file: ${file.name}`);
          
          // Extract text from document
          const { text, analysis } = await extractTextFromDocument(file);
          if (!text || text.trim().length === 0) {
            throw new Error('No text could be extracted from the document');
          }
          console.log('Extracted text:', text);

          // Update the Gemini prompt to be more specific
          const prompt = `
            You are a legal expert specializing in Indian Criminal Law. Analyze the following text and provide:
            1. The exact IPC section number that applies to this case
            2. The complete official definition of that IPC section from the Indian Penal Code
            3. The evidence from the text that supports this section

            Text to analyze:
            "${text}"

            Provide your response in this exact format:
            CRIME: [State the main crime identified]
            IPC SECTIONS: [List only the most relevant IPC section numbers]
            SECTION DETAILS:
            Section [number]: [Provide the exact official IPC section definition as written in the Indian Penal Code]
            EVIDENCE: [Quote the relevant parts from the text that match this section]

            Note: Please provide the exact, official IPC section definition, not a summary or paraphrase.
          `;

          // Call Gemini API
          const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.1, // Very low temperature for more deterministic output
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048 // Increased for full definitions
              }
            }
          );

          console.log('Gemini Response:', geminiResponse.data);

          if (!geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
          }

          const analysisText = geminiResponse.data.candidates[0].content.parts[0].text;
          console.log('Analysis Text:', analysisText);

          // Improved parsing of the analysis text
          const crimeMatch = analysisText.match(/CRIME:\s*(.+?)(?=\n|$)/);
          const ipcMatch = analysisText.match(/IPC SECTIONS:\s*(.+?)(?=\n|$)/);
          const sectionDetailsMatch = analysisText.match(/SECTION DETAILS:\n([\s\S]+?)(?=\nEVIDENCE:|$)/);
          const evidenceMatch = analysisText.match(/EVIDENCE:\s*(.+?)(?=\n|$)/);

          // Parse section details into structured format
          const sectionDetails = {};
          if (sectionDetailsMatch && sectionDetailsMatch[1]) {
            const sectionTexts = sectionDetailsMatch[1].split(/\nSection /);
            sectionTexts.forEach(text => {
              if (text.trim()) {
                const [sectionNum, ...descParts] = text.split(':');
                const description = descParts.join(':').trim();
                sectionDetails[sectionNum.trim()] = description;
              }
            });
          }

          // Create structured analysis object
          const analysisResult = {
            primaryCrime: crimeMatch?.[1]?.trim() || 'Unknown Crime',
            ipcSections: ipcMatch?.[1]?.trim().split(',').map(s => s.trim()) || [],
            sectionDetails: sectionDetails,
            evidence: evidenceMatch?.[1]?.trim().split(';').map(e => e.trim()) || []
          };

          // Create sections array with descriptions
          const sections = analysisResult.ipcSections.map(section => ({
            section: section,
            description: sectionDetails[section] || 'Description not available',
            confidence: 0.9
          }));

          return {
            fileName: file.name,
            fileType: file.type,
            analysis: {
              primaryCrime: analysisResult.primaryCrime,
              description: sections[0]?.description || '',
              evidence: analysisResult.evidence
            },
            sections: sections,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(analysisPromises);
      console.log('Analysis Results:', results);

      // Update state and localStorage atomically
      setAnalysisResults(prevResults => {
        const newResults = [...prevResults, ...results];
        localStorage.setItem('analysisResults', JSON.stringify(newResults));
        return newResults;
      });

      toast.success('Document analysis completed successfully');

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze document');
      toast.error(error.message || 'Failed to analyze document');
    } finally {
      // Remove loading class instead of setting global loading state
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

  const handleIPCSectionClick = async (section) => {
    try {
      // Get specialization directly from IPC_SPECIALIZATION_MAP first
      const specialization = IPC_SPECIALIZATION_MAP[section];
      
      console.log('Section:', section);
      console.log('Mapped Specialization:', specialization);

      if (!specialization) {
        throw new Error('No matching specialization found for this IPC section');
      }

      // Navigate to find-lawyers with the correct specialization
      navigate('/client/find-lawyers', {
        state: { 
          ipcSection: section,
          specialization: specialization // Pass the exact specialization string
        }
      });
      
    } catch (error) {
      console.error('Error handling IPC section click:', error);
      toast.error('Failed to find matching lawyers');
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
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the soft delete endpoint
      await axios.put(`http://localhost:5000/api/cases/${caseId}/delete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Update local state to remove the deleted case
      setCases(prevCases => prevCases.filter(c => c._id !== caseId));
      toast.success('Case moved to trash');

      // Refresh the cases list
      fetchCases();

    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error(error.response?.data?.message || 'Failed to delete case');
    }
  };

  // Add this function to fetch cases
  const fetchCases = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userId = sessionStorage.getItem("userid");
      
      if (!token || !userId) {
        toast.error('Authentication required. Please login again.');
        navigate('/login');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Fetch non-deleted cases
      const casesResponse = await axios.get(
        `http://localhost:5000/api/cases/client/${userId}`,
        config
      );

      if (casesResponse.data.success) {
        setCases(casesResponse.data.cases);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      handleError(error);
    }
  };

  const handleRestoreCase = async (caseId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call restore endpoint
      await axios.put(`http://localhost:5000/api/cases/${caseId}/restore`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Update local state
      setCases(prevCases => prevCases.map(c => 
        c._id === caseId ? { ...c, isDeleted: false, deletedAt: null } : c
      ));

      toast.success('Case restored successfully');
      
      // Refresh the cases list
      fetchCases();

    } catch (error) {
      console.error('Error restoring case:', error);
      toast.error(error.response?.data?.message || 'Failed to restore case');
    }
  };

  const handleDeleteAnalysis = async (index) => {
    try {
      // Get the specific analysis to delete
      const analysisToDelete = analysisResults[index];
      
      if (!analysisToDelete) {
        toast.error('Analysis not found');
        return;
      }

      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userid');

      if (!token || !userId) {
        toast.error('Authentication required. Please login again.');
        navigate('/login');
        return;
      }

      // Create case data for just this analysis
      const caseData = {
        title: analysisToDelete.fileName || 'Untitled Analysis',
        description: 'Analysis result moved to deleted cases',
        documents: [{
          fileName: analysisToDelete.fileName || 'analysis.txt',
          extractedText: analysisToDelete.analysis?.text || JSON.stringify(analysisToDelete),
          fileType: 'text/plain',
          uploadDate: new Date()
        }],
        caseType: formData.caseType || 'other',
        ipcSection: analysisToDelete.sections?.[0]?.section || null,
        ipcDescription: analysisToDelete.sections?.[0]?.description || '',
        relatedSections: analysisToDelete.sections?.slice(1).map(section => ({
          section: section.section,
          confidence: calculateSectionConfidence(section, analysisToDelete.analysis),
          description: section.description
        })) || [],
        isDeleted: true,
        analysisResults: analysisToDelete,
        clientId: userId
      };

      const response = await axios.post(
        'http://localhost:5000/api/cases',
        caseData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Remove only the selected analysis
        setAnalysisResults(prevResults => 
          prevResults.filter((_, i) => i !== index)
        );
        
        // Update localStorage with the filtered results
        const updatedResults = analysisResults.filter((_, i) => i !== index);
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

        return axios.post(
          'http://localhost:5000/api/cases',
          caseData,
          {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
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
        // Only remove the specific index that was selected
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

  const renderAnalysisAndCasesList = () => {
    const filteredCases = getFilteredCases().sort((a, b) => {
      const timeB = b.timestamp || '0';
      const timeA = a.timestamp || '0';
      return timeB.localeCompare(timeA);
    });
    
    const totalCount = analysisResults.length + filteredCases.length;

    return (
      <div className="analysis-panel mt-4">
        <div className="panel-header">
          <h4>Case Analysis Dashboard</h4>
          <div className="panel-actions">
            {selectedResults.size > 0 && (
              <button 
                className="btn btn-danger me-2"
                onClick={handleDeleteSelected}
              >
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Delete Selected ({selectedResults.size})
              </button>
            )}
            <span className="case-count">
              {totalCount} {totalCount === 1 ? 'Analysis' : 'Analyses'}
            </span>
          </div>
        </div>
        
        <div className="scrollable-dashboard">
          {analysisResults.map((result, index) => (
            <div key={`analysis-${index}`} className="analysis-card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    checked={selectedResults.has(result._id)}
                    onChange={() => toggleResultSelection(result)}
                    className="me-2"
                  />
                  <h5 className="mb-0">{result.fileName}</h5>
                </div>
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteAnalysis(index)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <div className="card-body">
                {/* Crime Identified */}
                <div className="mb-4">
                  <h6 className="text-primary">Crime Identified:</h6>
                  <div className="alert alert-info">
                    {result.analysis.primaryCrime}
                  </div>
                </div>

                {/* IPC Sections */}
                {result.sections && result.sections.length > 0 && (
                  <div className="ipc-sections mb-4">
                    <h6 className="text-primary">IPC Sections Identified:</h6>
                    {result.sections.map((section, idx) => (
                      <div key={idx} className="ipc-section-item">
                        <div className="section-content">
                          <h5>Section {section.section}</h5>
                          <div className="section-description">
                            {section.description}
                          </div>
                          <div className="section-actions mt-3">
                            <button
                              className="btn btn-outline-primary btn-sm me-2"
                              onClick={() => handleIPCSectionClick(section.section)}
                            >
                              <FontAwesomeIcon icon={faUserTie} className="me-2" />
                              Find Lawyers
                            </button>
                            <button
                              className="btn btn-outline-info btn-sm"
                              onClick={() => handleIPCSectionInfoClick(section)}
                              title="View complete section details on legal reference website"
                            >
                              <FontAwesomeIcon icon={faExternalLink} className="me-2" />
                              View Full Section Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Analysis */}
                <div className="case-metadata">
                  {/* Remove these two lines
                  <span className="badge bg-warning me-2">
                    Severity: {result.analysis.severity || 'Not Specified'}
                  </span>
                  <span className="badge bg-info">
                    Category: {result.analysis.category || 'Not Specified'}
                  </span>
                  */}
                </div>
              </div>
            </div>
          ))}
          
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
                            onClick={() => handleIPCSectionClick(caseItem.ipcSection)}
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
                                    onClick={() => handleIPCSectionClick(related.section)}
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
            <div className="empty-state">
              <FontAwesomeIcon icon={faFile} size="2x" className="text-muted mb-2" />
              <p>No cases found matching the selected filters</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const fetchLawyerSuggestions = async (ipcSection) => {
    try {
      setLoadingSuggestions(true);
      const response = await axios.get(`http://localhost:5000/api/cases/suggest-lawyers/${caseId}`);
      setSuggestedLawyers(response.data.lawyers);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching lawyer suggestions:', error);
      toast.error('Failed to fetch lawyer suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleLawyerSuggestions = async (ipcSection, caseDetails) => {
    try {
      setLoadingSuggestions(true);
      
      // Make API call with both IPC section and case details
      const response = await axios.get(
        `http://localhost:5000/api/cases/suggest-lawyers/${ipcSection}`,
        {
          params: { 
            caseDetails: JSON.stringify(caseDetails)
          }
        }
      );

      if (response.data.lawyers.length === 0) {
        toast.info(`No lawyers found specializing in ${response.data.specialization}`);
      } else {
        toast.success(`Found ${response.data.lawyers.length} lawyers specializing in ${response.data.specialization}`);
      }

      setSuggestedLawyers(response.data.lawyers);
      setSpecialization(response.data.specialization);
      setMatchInfo(response.data.matchInfo);
      setShowSuggestions(true);

      // Scroll to suggestions
      setTimeout(() => {
        document.querySelector('.lawyer-suggestions-container')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

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
      const specialization = IPC_SPECIALIZATION_MAP[section] || 
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