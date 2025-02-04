const express = require("express");
const multer = require("multer");
const path = require("path");
const lawyerController = require("../controllers/lawyerRegistrationController");
const Lawyer = require("../models/lawyerModel");
const User = require("../models/User");
const fs = require("fs");

const router = express.Router();

// Update storage configuration to handle additional certificates
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Update the registration route
router.post(
  "/register",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "lawDegreeCertificate", maxCount: 1 },
    { name: "barCouncilCertificate", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      next();
    } catch (error) {
      console.error("Error in file upload middleware:", error);
      res.status(500).json({
        success: false,
        message: "Error handling file upload",
        error: error.message
      });
    }
  },
  lawyerController.registerLawyer
);

// Update the certificate upload route
router.post(
  "/add-certificate/:lawyerId",
  upload.single("certificate"),
  async (req, res) => {
    try {
      const { lawyerId } = req.params;
      const { description } = req.body;

      console.log("Adding certificate for lawyer:", lawyerId);
      console.log("File:", req.file);
      console.log("Description:", description);

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No certificate file provided" });
      }

      // Find the lawyer first
      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        return res.status(404).json({ message: "Lawyer not found" });
      }

      // Create new certificate object
      const newCertificate = {
        name: req.file.originalname,
        file: req.file.filename,
        uploadDate: new Date(),
        description: description || "",
      };

      // Add certificate to array and save
      lawyer.additionalCertificates.push(newCertificate);

      // Save with explicit promise
      const savedLawyer = await lawyer.save();

      console.log("Updated lawyer document:", savedLawyer);
      console.log(
        "Additional certificates:",
        savedLawyer.additionalCertificates
      );

      res.status(200).json({
        message: "Certificate added successfully",
        certificate: newCertificate,
        additionalCertificates: savedLawyer.additionalCertificates,
      });
    } catch (error) {
      console.error("Error adding certificate:", error);
      res.status(500).json({
        message: "Error adding certificate",
        error: error.message,
        stack: error.stack,
      });
    }
  }
);

// Add a route to remove additional certificates
router.delete(
  "/remove-certificate/:lawyerId/:certificateId",
  lawyerController.removeAdditionalCertificate
);

// Route to get verified and active lawyers with search functionality
router.get("/verified", async (req, res) => {
  try {
    const { search } = req.query;
    console.log("Search query:", search);

    let query = { isVerified: true, visibleToClients: true };
    console.log("Initial query:", query);

    if (search) {
      query = {
        ...query,
        $or: [
          { fullname: { $regex: search, $options: "i" } },
          { specialization: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ],
      };
    }
    console.log("Final query:", query);

    const verifiedLawyers = await Lawyer.find(query);
    console.log("Found lawyers:", verifiedLawyers.length);

    res.json(verifiedLawyers);
  } catch (error) {
    console.error("Error in /verified route:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Route to get unverified lawyers (for admin use)
router.get("/unverified", async (req, res) => {
  try {
    const unverifiedLawyers = await Lawyer.find({ isVerified: false }).select({
      fullname: 1,
      email: 1,
      phone: 1,
      AEN: 1,
      specialization: 1,
      location: 1,
      fees: 1,
      lawDegreeCertificate: 1,
      barCouncilCertificate: 1,
      additionalCertificates: 1,
      visibleToClients: 1,
    });
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
      { new: true }
    );
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }
    res.json({ message: "Lawyer approved successfully", lawyer });
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

    res.json({ message: "Lawyer rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update the toggle visibility route
router.put("/toggle-visibility/:lawyerId", async (req, res) => {
  try {
    console.log("Toggle visibility request for ID:", req.params.lawyerId);
    
    // Use findOneAndUpdate to only update the visibleToClients field
    const lawyer = await Lawyer.findOneAndUpdate(
      { _id: req.params.lawyerId },
      [
        { 
          $set: { 
            visibleToClients: { $not: "$visibleToClients" } 
          } 
        }
      ],
      { new: true, runValidators: false }
    );
    
    if (!lawyer) {
      console.log("Lawyer not found with ID:", req.params.lawyerId);
      return res.status(404).json({ 
        success: false, 
        message: 'Lawyer not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Lawyer visibility ${lawyer.visibleToClients ? 'enabled' : 'disabled'}`,
      lawyer
    });

  } catch (error) {
    console.error("Error in toggle-visibility:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error updating lawyer visibility',
      error: error.message
    });
  }
});

// Update this route to handle lawyer details fetch
router.get("/:lawyerId", async (req, res) => {
  console.log("Fetching lawyer details for ID:");
  try {
    const lawyer = await Lawyer.findById(req.params.lawyerId);

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.status(200).json({
      fullname: lawyer.fullname,
      email: lawyer.email,
      phone: lawyer.phone,
      specialization: lawyer.specialization,
      location: lawyer.location,
      fees: lawyer.fees,
      availability: lawyer.availability,
      profilePicture: lawyer.profilePicture,
    });
  } catch (error) {
    console.error("Error fetching lawyer details:", error);
    res.status(500).json({ message: "Error fetching lawyer details" });
  }
});

// Add this new route at the beginning of your routes
router.get("/user-details/:email", lawyerController.getUserDetails);

module.exports = router;
