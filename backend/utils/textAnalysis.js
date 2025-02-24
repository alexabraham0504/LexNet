const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const fetch = require('node-fetch');
const TfIdf = natural.TfIdf;

// Expanded IPC patterns with more detailed keywords and sections
const ipcPatterns = {
  theft: {
    keywords: ['theft', 'steal', 'stolen', 'robbery', 'burglary', 'misappropriation', 'dishonestly']
  },
  fraud: {
    keywords: ['fraud', 'cheating', 'deceive', 'misrepresentation', 'dishonest', 'forgery', 'impersonation']
  },
  assault: {
    keywords: ['assault', 'hurt', 'injury', 'attack', 'force', 'violence', 'grievous', 'bodily']
  },
  criminal: {
    keywords: ['criminal', 'offense', 'illegal', 'unlawful', 'breach', 'violation', 'conspiracy']
  },
  property: {
    keywords: ['property', 'damage', 'mischief', 'trespass', 'destruction', 'vandalism']
  },
  document: {
    keywords: ['document', 'forged', 'false', 'fabricated', 'altered', 'counterfeit']
  },
  trust: {
    keywords: ['trust', 'breach', 'fiduciary', 'misuse', 'position', 'authority']
  },
  threat: {
    keywords: ['threat', 'intimidation', 'coercion', 'blackmail', 'extortion', 'harassment']
  },
  financial: {
    keywords: ['money', 'financial', 'transaction', 'payment', 'account', 'banking', 'loan']
  }
};

// Text preprocessing
function preprocessText(text) {
  // Convert to lowercase but preserve numbers
  text = text.toLowerCase();
  
  // Remove special characters but keep periods and hyphens
  text = text.replace(/[^\w\s\.-]/g, ' ');
  
  // Replace multiple spaces with single space
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// Enhanced key phrase extraction
function extractKeyPhrases(text) {
  const tokenizer = new natural.SentenceTokenizer();
  const sentences = tokenizer.tokenize(text);
  
  // Extract key terms using NLP
  const terms = new Map();
  sentences.forEach(sentence => {
    const words = new natural.WordTokenizer().tokenize(sentence);
    words.forEach(word => {
      if (word.length > 3) {
        terms.set(word.toLowerCase(), (terms.get(word.toLowerCase()) || 0) + 1);
      }
    });
  });

  return { sentences, terms };
}

// Add structured information extraction
const extractStructuredInfo = (text) => {
  // Clean the text first
  const cleanText = text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u00A0]/g, ' ') // Remove control chars
    .replace(/\s+/g, ' ')
    .trim();

  // More specific patterns for FIR/legal documents
  const patterns = {
    offence: {
      pattern: /(?:offence|crime|complaint)\s*(?:of|:)?\s*([^.!?\n]{3,100})/i,
      altPatterns: [
        /(?:accused|charged)\s+(?:of|with)\s+([^.!?\n]{3,100})/i,
        /(?:reported|alleged)\s+(?:that|about)\s+([^.!?\n]{3,100})/i
      ]
    },
    section: {
      pattern: /(?:u\/s|under\s+section|section)\s*(\d+[A-Za-z]?(?:\s*,\s*\d+[A-Za-z]?)*)/i,
      altPatterns: [
        /IPC\s+(?:section)?\s*(\d+[A-Za-z]?)/i,
        /(\d+[A-Za-z]?)\s*(?:of|,)?\s*(?:IPC|Indian\s+Penal\s+Code)/i
      ]
    },
    property: {
      pattern: /(?:property|items?)\s+(?:stolen|involved|seized)\s*:?\s*([^.!?\n]{3,100})/i,
      altPatterns: [
        /stolen\s+(?:property|items?)\s*:?\s*([^.!?\n]{3,100})/i,
        /seized\s+(?:the\s+following)?\s*:?\s*([^.!?\n]{3,100})/i
      ]
    },
    value: {
      pattern: /(?:value|worth|amount)\s*:?\s*(?:rs\.?)?\s*(\d[\d,]*)/i,
      altPatterns: [
        /(?:estimated|total)\s+(?:cost|value)\s*:?\s*(?:rs\.?)?\s*(\d[\d,]*)/i
      ]
    },
    date: {
      pattern: /(?:on|dated?|occurred\s+on)\s*:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
      altPatterns: [
        /(?:incident|event)\s+date\s*:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i
      ]
    },
    place: {
      pattern: /(?:at|place|venue|location)\s*:?\s*([^.!?\n]{3,50})/i,
      altPatterns: [
        /(?:occurred|happened)\s+at\s+([^.!?\n]{3,50})/i,
        /(?:police\s+station|ps)\s*:?\s*([^.!?\n]{3,50})/i
      ]
    }
  };

  const result = {};
  
  // Try to extract information using all patterns
  Object.entries(patterns).forEach(([key, { pattern, altPatterns }]) => {
    let match = cleanText.match(pattern);
    if (!match && altPatterns) {
      for (const altPattern of altPatterns) {
        match = cleanText.match(altPattern);
        if (match) break;
      }
    }
    if (match && match[1]) {
      const value = match[1].trim();
      // Validate extracted value
      if (value.length > 2 && !/^[.,\s]+$/.test(value)) {
        result[key] = value;
      }
    }
  });

  return result;
};

// Analyze document content with improved accuracy
async function analyzeDocumentContent(text) {
  try {
    const { sentences, terms } = extractKeyPhrases(text);
    const structuredInfo = extractStructuredInfo(text);
    
    // Format key points in a clear structure
    const keyPoints = [];
    
    // Add offence and section together if both exist
    if (structuredInfo.offence || structuredInfo.section) {
      let crimePoint = 'Crime: ';
      if (structuredInfo.offence) crimePoint += structuredInfo.offence;
      if (structuredInfo.section) crimePoint += ` (Section ${structuredInfo.section})`;
      keyPoints.push(crimePoint);
    }

    // Add property and value together if both exist
    if (structuredInfo.property || structuredInfo.value) {
      let propertyPoint = 'Property: ';
      if (structuredInfo.property) propertyPoint += structuredInfo.property;
      if (structuredInfo.value) propertyPoint += ` (Value: Rs.${structuredInfo.value})`;
      keyPoints.push(propertyPoint);
    }

    // Add location and date
    if (structuredInfo.place) {
      keyPoints.push(`Location: ${structuredInfo.place}`);
    }
    if (structuredInfo.date) {
      keyPoints.push(`Date: ${structuredInfo.date}`);
    }

    // Rest of your existing analysis code...
    
    return {
      keyPoints: keyPoints.length > 0 ? keyPoints : ['No clear key points could be extracted'],
      section: structuredInfo.section || null,
      description: sentences[0] || '',
      confidence: keyPoints.length > 0 ? 0.8 : 0.4,
      alternativeSections: []
    };
  } catch (error) {
    console.error('Error in document analysis:', error);
    return {
      keyPoints: ['Error analyzing document'],
      section: null,
      description: '',
      confidence: 0,
      alternativeSections: []
    };
  }
}

// Enhanced Bing search for IPC sections
async function searchIPCSectionsWithBing(text) {
  try {
    // First try to find direct section mentions
    const directMatches = text.match(/section\s+(\d+[A-Z]?)/gi);
    if (directMatches) {
      const section = directMatches[0].match(/\d+[A-Z]?/)[0];
      const description = await getIPCSectionDescription(section);
      return {
        section,
        description,
        confidence: 0.8,
        matchedTerms: '',
        source: 'direct_match'
      };
    }

    // If no direct matches, use Bing search
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
        `Indian Penal Code section for case involving: ${text.substring(0, 300)}`
      )}`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": "21f82301b9544a57bd153b1b4d7f3a03",
        },
      }
    );

    const data = await response.json();
    if (!data.webPages?.value?.length) return null;

    const results = data.webPages.value
      .slice(0, 3)
      .map(result => {
        const sectionMatch = result.snippet.match(/Section\s+(\d+[A-Z]?)/i);
        return sectionMatch ? {
          section: sectionMatch[1],
          description: result.snippet,
          confidence: 0.5,
          matchedTerms: '',
          source: 'bing_search'
        } : null;
      })
      .filter(Boolean);

    return results[0] || null;
  } catch (error) {
    console.error('Error in Bing search:', error);
    return null;
  }
}

// Get detailed section description
async function getIPCSectionDescription(section) {
  try {
    // First check if section is valid
    if (!section || typeof section !== 'string') {
      throw new Error('Invalid section number');
    }

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
        `IPC Section ${section} Indian Penal Code full section text explanation`
      )}`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY || "21f82301b9544a57bd153b1b4d7f3a03",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.webPages?.value?.length) {
      return `Section ${section} of the Indian Penal Code - Description not available`;
    }

    // Combine multiple results for better context
    const descriptions = data.webPages.value
      .slice(0, 2)
      .map(page => page.snippet)
      .join(' ');

    return descriptions || `Section ${section} of the Indian Penal Code - Description not available`;
  } catch (error) {
    console.error('Error fetching section description:', error);
    throw error; // Propagate error to be handled by the route
  }
}

// Add these helper functions at the top of the file
const calculateConfidenceScore = (documentText, sectionText) => {
  const doc = documentText.toLowerCase();
  const section = sectionText.toLowerCase();
  
  // Calculate keyword match score
  const keywordScore = calculateKeywordMatchScore(doc, section);
  
  // Calculate crime pattern match score
  const crimeScore = calculateCrimePatternScore(doc, section);
  
  // Calculate semantic similarity
  const similarityScore = calculateSemanticSimilarity(doc, section);
  
  // Weighted average of scores
  const confidence = (
    (keywordScore * 0.4) +
    (crimeScore * 0.4) +
    (similarityScore * 0.2)
  );
  
  return Math.min(Math.max(confidence, 0), 1);
};

const calculateKeywordMatchScore = (doc, section) => {
  const docWords = new Set(extractKeywords(doc));
  const sectionWords = new Set(extractKeywords(section));
  
  const intersection = new Set([...docWords].filter(x => sectionWords.has(x)));
  return intersection.size / Math.max(sectionWords.size, 1);
};

const calculateCrimePatternScore = (doc, section) => {
  let matchCount = 0;
  let totalPatterns = 0;
  
  for (const pattern of Object.values(ipcPatterns)) {
    totalPatterns += pattern.keywords.length;
    matchCount += pattern.keywords.filter(keyword => 
      doc.includes(keyword) && section.includes(keyword)
    ).length;
  }
  
  return matchCount / totalPatterns;
};

const calculateSemanticSimilarity = (doc, section) => {
  const docTokens = new Set(doc.split(/\W+/));
  const sectionTokens = new Set(section.split(/\W+/));
  
  const intersection = new Set([...docTokens].filter(x => sectionTokens.has(x)));
  const union = new Set([...docTokens, ...sectionTokens]);
  
  return intersection.size / union.size;
};

const extractKeywords = (text) => {
  // Common legal keywords to ignore
  const commonWords = new Set([
    'the', 'and', 'or', 'in', 'of', 'to', 'a', 'an', 'is', 'are', 'was', 'were',
    'will', 'shall', 'may', 'can', 'could', 'would', 'should', 'must', 'have', 'has',
    'had', 'been', 'being', 'do', 'does', 'did', 'done'
  ]);
  
  // Split text into words and filter
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => 
      word.length > 2 && 
      !commonWords.has(word) &&
      isNaN(word) // Exclude numbers
    );
};

module.exports = {
  analyzeDocumentContent,
  extractKeyPhrases,
  getIPCSectionDescription,
  calculateConfidenceScore,
  extractKeywords,
  ipcPatterns
}; 