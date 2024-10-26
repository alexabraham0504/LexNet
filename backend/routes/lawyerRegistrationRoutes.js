const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  registerLawyer,
  verifyLawyer,
  getUnverifiedLawyers,  // New controller for admin to get unverified lawyers
  getLawyerById,         // New controller for lawyer dashboard to get status
} = require("../controllers/lawyerRegistrationController");

const router = express.Router();

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Register lawyer route with file upload
router.post(
  "/register",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "lawDegreeCertificate", maxCount: 1 },
    { name: "barCouncilCertificate", maxCount: 1 },
  ]),
  registerLawyer
);

// Lawyer model import
const Lawyer = require("../models/lawyerModel");

// Route to get verified and active lawyers for client view
router.get("/verified", async (req, res) => {
  try {
    // Fetch all lawyers without any filtering
    const allLawyers = await Lawyer.find({});
    console.log(allLawyers);
    res.json(allLawyers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



// Route to get unverified lawyers (for admin use)
router.get("/unverified", async (req, res) => {
  try {
    const unverifiedLawyers = await Lawyer.find({ isVerified: false });
    res.json(unverifiedLawyers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to approve a lawyer
router.put("/approve/:lawyerId", async (req, res) => {
  try {
    const lawyerId = req.params.lawyerId;
    const lawyer = await Lawyer.findByIdAndUpdate(
      lawyerId,
      { isVerified: true, visibleToClients: true },
      { new: true } // Return the updated document
    );
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }
    res.json({
      message: "Lawyer has been verified and approved",
      lawyer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to reject and delete a lawyer
router.delete("/reject/:lawyerId", async (req, res) => {
  try {
    const lawyerId = req.params.lawyerId;
    const lawyer = await Lawyer.findByIdAndDelete(lawyerId);

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({
      message: "Lawyer has been rejected and removed from the system",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to toggle lawyer activation/visibility (Admin control)
router.put("/toggle-visibility/:lawyerId", async (req, res) => {
  try {
    const lawyerId = req.params.lawyerId;

    // Find the lawyer by ID and toggle the `visibleToClients` field
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    // Toggle the visibility
    lawyer.visibleToClients = !lawyer.visibleToClients;
    await lawyer.save();

    res.json({
      message: `Lawyer visibility ${lawyer.visibleToClients ? "activated" : "deactivated"}`,
      lawyer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;