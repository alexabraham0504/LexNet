// Map IPC sections to specializations
exports.IPC_SPECIALIZATION_MAP = {
  // Environmental violations
  '268': { specialization: 'Environmental Law', type: 'Public Nuisance' },
  '269': { specialization: 'Environmental Law', type: 'Environmental Hazard' },
  '278': { specialization: 'Environmental Law', type: 'Air Pollution' },
  '290': { specialization: 'Environmental Law', type: 'Public Nuisance' },
  
  // Property crimes
  '378': { specialization: 'Criminal Law', type: 'Theft' },
  '379': { specialization: 'Criminal Law', type: 'Theft' },
  '411': { specialization: 'Criminal Law', type: 'Property Crime' },
  
  // Violent crimes
  '302': { specialization: 'Criminal Law', type: 'Murder' },
  '304': { specialization: 'Criminal Law', type: 'Culpable Homicide' },
  '304A': { specialization: 'Criminal Law', type: 'Death by Negligence' },
  
  // Civil matters
  '415': { specialization: 'Civil Law', type: 'Cheating' },
  '420': { specialization: 'Civil Law', type: 'Fraud' },
  
  // Family matters
  '498A': { specialization: 'Family Law', type: 'Domestic Violence' },
  '304B': { specialization: 'Family Law', type: 'Dowry Death' }
};

exports.getSpecializationForSection = (section) => {
  return exports.IPC_SPECIALIZATION_MAP[section] || { 
    specialization: 'General Practice',
    type: 'General'
  };
}; 