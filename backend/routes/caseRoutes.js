const express = require("express");
const router = express.Router();
const Case = require("../models/Case");

const multer = require("multer");
const path = require("path");
// Get all cases for a specific lawyer
router.get("/lawyer/:lawyerId", async (req, res) => {
  try {
    const cases = await Case.find({ lawyerId: req.params.lawyerId });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Setup multer for file uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with original extension
  },
});

const upload = multer({ storage });

// POST route for creating a new case and uploading documents
router.post("/case", upload.array("documents", 5), async (req, res) => {
  const { title, description, clientId, lawyerId } = req.body;

  // Validate required fields
  if (!title || !description || !clientId) {
    return res
      .status(400)
      .json({ error: "Title, description, and clientId are required." });
  }

  try {
    const filePaths = req.files ? req.files.map((file) => file.path) : []; // Get file paths

    const newCase = new Case({
      title,
      description,
      clientId,
      lawyerId,
      status: "Open", // Default status for new cases
      createdAt: Date.now(),
      updatedAt: Date.now(),
      documents: filePaths, // Save file paths to the case's documents field
    });

    const savedCase = await newCase.save();
    res.status(201).json(savedCase);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create case.", details: error.message });
  }
});

// Update an existing case
router.put("/:caseId", async (req, res) => {
  const { title, description, status, notes } = req.body;

  // Check if at least one field is provided for update
  if (!title && !description && !status && !notes) {
    return res.status(400).json({
      error:
        "At least one field (title, description, status, or notes) must be provided.",
    });
  }

  try {
    // Dynamically build the fields to update
    const updatedFields = { updatedAt: Date.now() };

    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (status) updatedFields.status = status;
    if (notes) updatedFields.notes = notes;

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.caseId,
      updatedFields,
      { new: true, runValidators: true } // Return updated document and validate
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
