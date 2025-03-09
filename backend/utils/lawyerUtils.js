const getRelatedSpecializations = (specialization) => {
  const specializationMap = {
    'Environmental Law': ['Environmental Protection', 'Climate Change', 'Pollution Control'],
    'Criminal Law': ['Criminal Defense', 'Criminal Prosecution', 'White Collar Crime'],
    'Civil Law': ['Civil Litigation', 'Contract Law', 'Tort Law'],
    'Family Law': ['Divorce', 'Child Custody', 'Domestic Relations'],
    'Real Estate Law': ['Property Law', 'Land Use', 'Construction Law'],
    'General Practice': ['All Areas', 'Multiple Specialties']
  };

  return specializationMap[specialization] || [];
};

module.exports = {
  getRelatedSpecializations
}; 