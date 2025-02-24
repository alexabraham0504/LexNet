const tamilTransliteration = {
  // Basic legal terms
  'பிரிவு': 'Section',
  'குற்றம்': 'Offence',
  'சாட்சி': 'Witness',
  'புகார்': 'Complaint',
  'விசாரணை': 'Investigation',
  // Property related terms
  'சொத்து': 'Property',
  'திருட்டு': 'Theft',
  'மதிப்பு': 'Value',
  // Action related terms
  'நடவடிக்கை': 'Action',
  'மேற்கொள்ளப்பட்டது': 'Taken',
  'அறிக்கை': 'Report',
  // Numbers and dates
  'முதல்': 'First',
  'இரண்டு': 'Second',
  // Location related
  'திருப்பூர்': 'Tiruppur',
  // Add more mappings for common FIR terms
  'மொத்த': 'Total',
  'விவரங்கள்': 'Details',
  'இணைப்பு': 'Attachment'
};

// Modify the transliterate function
const transliterate = (text, sourceLanguage) => {
  if (sourceLanguage === 'Tamil') {
    let transliteratedText = text;
    
    // First pass: Replace known Tamil terms
    Object.entries(tamilTransliteration).forEach(([tamil, english]) => {
      transliteratedText = transliteratedText.replace(
        new RegExp(tamil, 'g'), 
        english
      );
    });

    // Second pass: Extract and preserve numbers and dates
    const datePattern = /(\d{2})[/-](\d{4})/g;
    const numbers = transliteratedText.match(/\d+/g) || [];
    
    // Clean up the text while preserving important information
    transliteratedText = transliteratedText
      .replace(/[\u0B80-\u0BFF]+/g, ' ') // Remove remaining Tamil characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    return transliteratedText;
  }
  return text;
};