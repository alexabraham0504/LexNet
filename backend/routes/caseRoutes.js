const express = require("express");
const router = express.Router();
const Case = require("../models/Case");

// Get all cases for a specific lawyer
router.get("/lawyer/:lawyerId", async (req, res) => {
  try {
    const cases = await Case.find({ lawyerId: req.params.lawyerId });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:caseId", async (req, res) => {
  const { status, notes } = req.body;

  // Validate request body
  if (!status && !notes) {
    return res
      .status(400)
      .json({
        error: "At least one field (status or notes) must be provided.",
      });
  }

  try {
    const updatedFields = { updatedAt: Date.now() };

    if (status) updatedFields.status = status;
    if (notes) updatedFields.notes = notes;

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.caseId,
      updatedFields,
      { new: true, runValidators: true } // Return the updated document and validate new data
    );

    if (!updatedCase) {
      return res.status(404).json({ error: "Case not found." });
    }

    res.status(200).json(updatedCase);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update case.", details: error.message });
  }
});

module.exports = router;
