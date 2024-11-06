const express = require("express");
const router = express.Router();
const Case = require("../models/Case"); // Adjust path to your Case model
const multer = require("multer");

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Create a new case
router.post("/", async (req, res) => {
    try {
        const newCase = new Case({
            title: req.body.title,
            description: req.body.description,
            clientId: req.body.clientId,
            lawyerId: req.body.lawyerId, // This comes from the client
            status: "Open",
            documents: [],
        });
        const savedCase = await newCase.save();
        res.status(201).json(savedCase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get cases by client ID with populated lawyer name
router.get("/client/:clientId", async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const cases = await Case.find({ clientId })
            .populate("lawyerId", "fullName"); // Populating lawyer's full name
        console.log("Fetched cases:", cases); // Log the fetched cases for debugging
        res.json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get cases by lawyer ID
router.get("/lawyer/:lawyerId", async (req, res) => {
    try {
        const cases = await Case.find({ lawyerId: req.params.lawyerId });
        res.json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update case status
router.patch("/:id/status", async (req, res) => {
    try {
        const updatedCase = await Case.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(updatedCase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload a document to a case
router.post("/:id/upload", upload.single("document"), async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id);
        caseItem.documents.push(req.file.path); // Store the file path in the case documents array
        await caseItem.save();
        res.status(200).json(caseItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const fetchLawyers = async () => {
    try {
        const response = await axios.get("/api/lawyerModel"); // Adjust this endpoint based on your backend
        // Filter to get only approved and verified lawyers
        const verifiedLawyers = response.data.filter(lawyer => lawyer.isVerified);
        setLawyers(verifiedLawyers);
    } catch (error) {
        toast.error("Error fetching lawyers");
        console.error("Error fetching lawyers:", error);
    }
};


module.exports = router;
