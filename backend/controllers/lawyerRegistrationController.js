const Lawyer = require("../models/lawyerModel");
const multer = require("multer");
const path = require("path");

// Multer file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Customize the path if needed
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Setup the multer middleware for file uploads
exports.uploadFiles = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "lawDegreeCertificate", maxCount: 1 },
  { name: "barCouncilCertificate", maxCount: 1 },
]);

// Register a new lawyer
exports.registerLawyer = async (req, res) => {
  try {
    const {
      fullname,
      email,
      phone,
      AEN,
      specialization,
      location,
      availability,
      fees,
      visibleToClients, // Passed as string from frontend
    } = req.body;

    const isVisibleToClients = visibleToClients === "true";

    // Check for missing fields
    if (
      !fullname ||
      !email ||
      !phone ||
      !AEN ||
      !specialization ||
      !location ||
      !availability ||
      !fees
    ) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Check if a lawyer with this email already exists
    const existingLawyer = await Lawyer.findOne({ email });
    if (existingLawyer) {
      return res.status(409).json({ message: "Email already exists. Please use a different email." });
    }

    // Create a new lawyer document
    const newLawyer = new Lawyer({
      fullname,
      email,
      phone,
      AEN,
      specialization,
      location,
      availability,
      fees,
      profilePicture: req.files?.["profilePicture"]?.[0]?.filename || null,
      lawDegreeCertificate: req.files?.["lawDegreeCertificate"]?.[0]?.filename || null,
      barCouncilCertificate: req.files?.["barCouncilCertificate"]?.[0]?.filename || null,
      visibleToClients: isVisibleToClients, // Correctly set boolean
      isVerified: false, // Default to unverified
    });

    // Save the lawyer to the database
    await newLawyer.save();
    return res.status(201).json({ message: "Lawyer registered successfully." });
  } catch (error) {
    console.error("Error registering lawyer:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate entry detected." });
    }
    return res.status(500).json({ error: "Failed to register lawyer." });
  }
};


// Fetch unverified lawyers (For Admin Dashboard)
exports.getUnverifiedLawyers = async (req, res) => {
  try {
    const unverifiedLawyers = await Lawyer.find({ isVerified: false });
    return res.status(200).json(unverifiedLawyers);
  } catch (error) {
    console.error("Error fetching unverified lawyers:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch unverified lawyers." });
  }
};

// Verify a lawyer by admin
exports.verifyLawyer = async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  try {
    const lawyer = await Lawyer.findById(id);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found." });
    }

    lawyer.isVerified = approved;
    await lawyer.save();

    return res.status(200).json({
      message: `Lawyer has been ${approved ? "approved" : "rejected"}.`,
    });
  } catch (error) {
    console.error("Error verifying lawyer:", error);
    return res.status(500).json({ error: "Failed to verify lawyer." });
  }
};

// Fetch lawyer by ID (for Lawyer Dashboard)
exports.getLawyerById = async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found." });
    }
    return res.status(200).json(lawyer);
  } catch (error) {
    console.error("Error fetching lawyer:", error);
    return res.status(500).json({ error: "Failed to fetch lawyer." });
  }
};
