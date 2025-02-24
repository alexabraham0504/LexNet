const axios = require('axios');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

const BING_API_KEY = "21f82301b9544a57bd153b1b4d7f3a03";

class BertService {
  async analyzeText(text) {
    try {
      console.log('Original text:', text);
      
      // Clean and preprocess the text
      const cleanedText = this.preprocessText(text);
      console.log('Cleaned text:', cleanedText);

      // First analyze the content deeply
      const contentAnalysis = await this.performDeepContentAnalysis(cleanedText);
      console.log('Content analysis:', contentAnalysis);

      // Look for explicit IPC sections
      const explicitSections = this.findExplicitIPCSections(cleanedText);
      console.log('Explicit sections found:', explicitSections);

      if (explicitSections.length > 0) {
        const sectionsWithDetails = await this.getIPCSectionDetails(explicitSections, contentAnalysis);
        return {
          type: 'explicit',
          sections: sectionsWithDetails,
          analysis: contentAnalysis
        };
      }

      // If no explicit sections, find relevant ones based on content
      const relevantSections = await this.findRelevantIPCSections(contentAnalysis);
      return {
        type: 'derived',
        sections: relevantSections,
        analysis: contentAnalysis
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  preprocessText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,?!()-]/g, ' ')
      .replace(/\b(the|and|or|but|in|on|at|to)\b/gi, ' ')
      .trim();
  }

  async performDeepContentAnalysis(text) {
    const tfidf = new TfIdf();
    tfidf.addDocument(text);

    // Extract important terms using TF-IDF
    const terms = [];
    tfidf.listTerms(0).forEach(item => {
      if (item.tfidf > 3) {
        terms.push({ term: item.term, weight: item.tfidf });
      }
    });

    // Extract key information
    const analysis = {
      keyPhrases: this.extractKeyPhrases(text),
      importantSentences: this.extractImportantSentences(text),
      categories: this.categorizeContent(text),
      legalEntities: this.extractLegalEntities(text),
      crimePatterns: this.identifyCrimePatterns(text),
      importantTerms: terms
    };

    // Determine primary offense
    analysis.primaryOffense = this.determinePrimaryOffense(analysis);

    return analysis;
  }

  determinePrimaryOffense(analysis) {
    const offenseTypes = {
      VIOLENT: ['murder', 'assault', 'hurt', 'injury', 'death', 'attack'],
      PROPERTY: ['theft', 'robbery', 'burglary', 'stolen', 'damage'],
      FRAUD: ['cheating', 'fraud', 'forgery', 'deception'],
      HARASSMENT: ['harassment', 'stalking', 'threaten', 'intimidation'],
      CYBERCRIME: ['cyber', 'online', 'digital', 'computer', 'internet']
    };

    let scores = {};
    for (const [type, keywords] of Object.entries(offenseTypes)) {
      scores[type] = 0;
      keywords.forEach(keyword => {
        if (analysis.keyPhrases.some(phrase => phrase.term.includes(keyword))) {
          scores[type] += 2;
        }
        if (analysis.importantSentences.some(sentence => 
          sentence.toLowerCase().includes(keyword)
        )) {
          scores[type] += 1;
        }
      });
    }

    const primaryOffense = Object.entries(scores)
      .reduce((max, [type, score]) => 
        score > max.score ? {type, score} : max, 
        {type: 'UNKNOWN', score: 0}
      );

    return {
      type: primaryOffense.type,
      confidence: Math.min(primaryOffense.score / 10, 1)
    };
  }

  extractKeyPhrases(text) {
    const legalKeywords = [
      'murder', 'theft', 'assault', 'fraud', 'rape', 'kidnapping',
      'robbery', 'burglary', 'criminal', 'illegal', 'unlawful',
      'victim', 'accused', 'witness', 'evidence', 'complaint',
      'threaten', 'damage', 'hurt', 'injury', 'death', 'attack',
      'cheating', 'forgery', 'harassment', 'conspiracy'
    ];

    const words = tokenizer.tokenize(text.toLowerCase());
    const phrases = [];
    
    words.forEach((word, index) => {
      if (legalKeywords.includes(word)) {
        // Look for compound phrases
        let phrase = word;
        if (index > 0) phrase = words[index-1] + ' ' + phrase;
        if (index < words.length - 1) phrase = phrase + ' ' + words[index+1];
        
        phrases.push({
          term: phrase,
          relevance: legalKeywords.includes(word) ? 1.0 : 0.7
        });
      }
    });

    return phrases;
  }

  async getIPCSectionDetails(sections, contentAnalysis) {
    return Promise.all(sections.map(async (section) => {
      try {
        const query = `Section ${section} IPC Indian Penal Code ${contentAnalysis.primaryOffense.type} explanation punishment`;
        const response = await axios.get(
          'https://api.bing.microsoft.com/v7.0/search',
          {
            params: {
              q: query,
              count: 3,
              responseFilter: 'Webpages'
            },
            headers: {
              'Ocp-Apim-Subscription-Key': '21f82301b9544a57bd153b1b4d7f3a03'
            }
          }
        );

        const webPages = response.data.webPages?.value || [];
        if (webPages.length > 0) {
          const relevantPage = webPages.find(page => 
            page.snippet.toLowerCase().includes('section') && 
            page.snippet.toLowerCase().includes(section)
          ) || webPages[0];

          return {
            section,
            description: this.cleanDescription(relevantPage.snippet),
            confidence: 1.0,
            source: relevantPage.url
          };
        }
      } catch (error) {
        console.error(`Error fetching details for Section ${section}:`, error);
      }
      return null;
    })).then(results => results.filter(Boolean));
  }

  findExplicitIPCSections(text) {
    const patterns = [
      /(?:Section|Sec\.|S\.) (\d+[A-Z]?)(?:\s+(?:of|IPC|Indian Penal Code))/gi,
      /(?:IPC|Indian Penal Code)\s+(?:Section|Sec\.|S\.) (\d+[A-Z]?)/gi,
      /(\d+[A-Z]?)\s+(?:of|IPC|Indian Penal Code)/gi,
      /IPC\s+(\d+[A-Z]?)/gi,
      /Section\s+(\d+[A-Z]?)/gi
    ];

    const sections = new Set();
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const section = match[1].trim();
        if (/^\d+[A-Z]?$/.test(section)) { // Validate section number format
          sections.add(section);
        }
      }
    });

    return Array.from(sections);
  }

  cleanDescription(text) {
    // Remove extra whitespace and clean up the text
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,()-]/g, '')
      .trim();
  }

  async findRelevantIPCSections(analysis) {
    try {
      const searchTerms = [
        ...analysis.categories.map(c => c.category),
        ...analysis.keyPhrases.map(p => p.term),
        ...analysis.crimePatterns.map(p => p.type)
      ].filter(Boolean).join(' ');

      console.log('Searching with terms:', searchTerms);

      const response = await axios.get(
        'https://api.bing.microsoft.com/v7.0/search',
        {
          params: {
            q: `Indian Penal Code IPC sections for ${searchTerms} law punishment`,
            count: 10,
            responseFilter: 'Webpages'
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
        const sectionMatches = page.snippet.match(/Section\s+(\d+[A-Z]?)/gi);
        if (sectionMatches) {
          for (const match of sectionMatches) {
            const section = match.match(/\d+[A-Z]?/)[0];
            if (!sections.has(section)) {
              sections.add(section);
              const confidence = this.calculateRelevance(page.snippet, searchTerms);
              if (confidence > 0.5) {
                results.push({
                  section: section,
                  description: this.cleanDescription(page.snippet),
                  confidence: confidence,
                  source: page.url
                });
              }
            }
          }
        }
      }

      return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    } catch (error) {
      console.error('Error finding relevant IPC sections:', error);
      return [];
    }
  }

  calculateRelevance(description, searchTerms) {
    let score = 0.5; // Base score
    const terms = searchTerms.toLowerCase().split(' ');
    
    terms.forEach(term => {
      if (description.toLowerCase().includes(term)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1);
  }

  extractImportantSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const legalIndicators = [
      'section', 'ipc', 'criminal', 'victim', 'accused',
      'complaint', 'police', 'court', 'witness', 'evidence'
    ];

    return sentences
      .filter(sentence => 
        legalIndicators.some(indicator => 
          sentence.toLowerCase().includes(indicator)
        )
      )
      .slice(0, 5);
  }

  categorizeContent(text) {
    const categories = [];
    const categoryPatterns = {
      'VIOLENT_CRIME': /(?:murder|assault|attack|injury|hurt|death)/i,
      'PROPERTY_CRIME': /(?:theft|robbery|burglary|stolen|damage)/i,
      'FINANCIAL_CRIME': /(?:fraud|cheating|forgery|corruption)/i,
      'SEXUAL_OFFENSE': /(?:rape|sexual|molestation|harassment)/i,
      'CYBERCRIME': /(?:cyber|online|digital|computer|hacking)/i,
      'CRIMINAL_CONSPIRACY': /(?:conspiracy|planning|organized|gang)/i
    };

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(text)) {
        const matches = text.match(pattern) || [];
        const confidence = matches.length / 10; // Normalize confidence
        categories.push({
          category,
          confidence: Math.min(confidence, 1),
          evidence: matches[0]
        });
      }
    }

    return categories.sort((a, b) => b.confidence - a.confidence);
  }

  extractLegalEntities(text) {
    const entities = [];
    const entityPatterns = {
      'SECTION': /Section \d+[A-Z]?/gi,
      'DATE': /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      'LOCATION': /(?:at|in|near) ([A-Z][a-z]+ ?(?:[A-Z][a-z]+)?)/g,
      'PERSON': /(?:Mr\.|Mrs\.|Ms\.) [A-Z][a-z]+ [A-Z][a-z]+/g
    };

    for (const [type, pattern] of Object.entries(entityPatterns)) {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        entities.push({ type, value: match });
      });
    }

    return entities;
  }

  identifyCrimePatterns(text) {
    const patterns = [];
    const crimePatterns = {
      'MOTIVE': /(?:because|due to|reason|motive)/i,
      'WEAPON': /(?:with|using) (?:a |an )?(?:knife|gun|weapon|stick|rod)/i,
      'TIME': /(?:at|around|about) \d{1,2}(?::\d{2})? ?(?:am|pm)?/i,
      'WITNESSES': /(?:witness|seen by|observed by|in presence of)/i
    };

    for (const [type, pattern] of Object.entries(crimePatterns)) {
      const matches = text.match(pattern) || [];
      if (matches.length > 0) {
        patterns.push({
          type,
          matches: matches,
          relevance: matches.length / 5 // Normalize relevance
        });
      }
    }

    return patterns;
  }
}

module.exports = {
  bertService: new BertService()
}; 