const express = require('express');
const router = express.Router();
const Case = require('../models/Case');

// Get all cases for a specific lawyer
router.get('/lawyer/:lawyerId', async (req, res) => {
  try {
    const cases = await Case.find({ lawyerId: req.params.lawyerId });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a case's status and notes
router.put('/:caseId', async (req, res) => {
  const { status, notes } = req.body;
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.caseId,
      {
        status,
        notes,
        updatedAt: Date.now()
      },
      { new: true }
    );
    res.json(updatedCase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
