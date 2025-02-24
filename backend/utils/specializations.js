// Update the specialization mapping with clearer categories
const legalSpecializations = {
  CRIMINAL: {
    name: 'Criminal Law',
    sections: {
      // Theft and Property crimes (378-382)
      '378': 'Theft',
      '379': 'Theft',
      '380': 'Theft',
      '382': 'Theft',
      // Violence and assault (319-323)
      '319': 'Assault',
      '320': 'Assault',
      '321': 'Assault',
      '322': 'Assault',
      // Murder and homicide (302-304)
      '302': 'Murder',
      '304': 'Homicide',
      // Kidnapping (359-366)
      '359': 'Kidnapping',
      '363': 'Kidnapping',
      '366': 'Kidnapping',
      // Sexual offenses (375-376)
      '375': 'Sexual Offense',
      '376': 'Sexual Offense'
    }
  },
  CIVIL: {
    name: 'Civil Law',
    sections: {
      '420': 'Cheating',
      '406': 'Criminal Breach of Trust',
      '499': 'Defamation',
      '425': 'Property Damage',
      '441': 'Trespass'
    }
  },
  ENVIRONMENTAL: {
    name: 'Environmental Law',
    sections: {
      '268': 'Public Nuisance',
      '277': 'Water Pollution',
      '278': 'Air Pollution',
      '284': 'Environmental Hazard'
    }
  },
  FAMILY: {
    name: 'Family Law',
    sections: {
      '493': 'Cohabitation',
      '494': 'Bigamy',
      '498A': 'Domestic Violence'
    }
  }
};

// Function to get specialization based on IPC section
const getExactSpecialization = (sectionNumber) => {
  // Check each category for matching IPC section
  for (const [category, data] of Object.entries(legalSpecializations)) {
    if (data.sections[sectionNumber]) {
      return {
        mainCategory: category,
        specialization: data.name, // This will be "Criminal Law", "Civil Law", etc.
        subType: data.sections[sectionNumber] // This will be "Theft", "Murder", etc.
      };
    }
  }

  // Default mapping based on section ranges
  const sectionNum = parseInt(sectionNumber);
  if (sectionNum >= 299 && sectionNum <= 377) { // IPC sections 299-377
    return {
      mainCategory: 'CRIMINAL',
      specialization: 'Criminal Law',
      subType: 'Criminal Offense'
    };
  } else if (sectionNum >= 378 && sectionNum <= 462) { // IPC sections 378-462
    return {
      mainCategory: 'CRIMINAL',
      specialization: 'Criminal Law',
      subType: 'Property Crime'
    };
  } else if (sectionNum >= 268 && sectionNum <= 294) { // Environmental sections
    return {
      mainCategory: 'ENVIRONMENTAL',
      specialization: 'Environmental Law',
      subType: 'Environmental Offense'
    };
  }

  // Default to Criminal Law if no matches found
  return {
    mainCategory: 'CRIMINAL',
    specialization: 'Criminal Law',
    subType: 'General'
  };
};

module.exports = {
  legalSpecializations,
  getExactSpecialization
}; 