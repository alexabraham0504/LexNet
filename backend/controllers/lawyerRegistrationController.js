const Lawyer = require("../models/lawyerModel");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Add file filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Setup the multer middleware for file uploads
exports.uploadFiles = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "lawDegreeCertificate", maxCount: 1 },
  { name: "barCouncilCertificate", maxCount: 1 },
]);

// Get user details by email for pre-filling lawyer registration
exports.getUserDetails = async (req, res) => {
  try {
    const { email } = req.params;

    // Find user by email in User schema
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user role is Lawyer
    if (user.role !== "Lawyer") {
      return res
        .status(403)
        .json({ message: "User is not registered as a lawyer" });
    }

    // Return relevant user details
    const userDetails = {
      fullname: user.fullName,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
    };

    // Check if lawyer profile already exists
    const existingLawyer = await Lawyer.findOne({ email });

    if (existingLawyer) {
      return res.status(200).json({
        ...userDetails,
        ...existingLawyer.toObject(),
        location: {
          address: existingLawyer.location?.address || "",
          lat: existingLawyer.location?.lat || null,
          lng: existingLawyer.location?.lng || null
        },
        officeLocation: {
          address: existingLawyer.officeLocation?.address || "",
          lat: existingLawyer.officeLocation?.lat || null,
          lng: existingLawyer.officeLocation?.lng || null
        },
        isExisting: true
      });
    }

    // If no lawyer profile exists, return user details
    res.status(200).json({
      ...userDetails,
      isExisting: false,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ 
      message: "Error fetching user details", 
      error: error.message 
    });
  }
};

// Register lawyer with pre-filled data
exports.registerLawyer = async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    console.log("Files received:", req.files);

    const {
      fullname,
      email,
      phone,
      AEN,
      specialization,
      yearsOfExperience,
      location,
      fees,
      availability,
      visibleToClients,
      languagesSpoken,
      practicingCourts
    } = req.body;

    // Validate required fields
    if (!email || !fullname || !phone || !AEN) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: ['email', 'fullname', 'phone', 'AEN'],
        received: { email, fullname, phone, AEN }
      });
    }

    // Validate yearsOfExperience
    if (isNaN(yearsOfExperience) || yearsOfExperience < 1 || yearsOfExperience > 50) {
      return res.status(400).json({
        success: false,
        message: "Years of experience must be between 1 and 50"
      });
    }

    // Parse JSON strings
    const parsedLanguages = languagesSpoken ? JSON.parse(languagesSpoken) : [];
    const parsedCourts = practicingCourts ? JSON.parse(practicingCourts) : [];
    const parsedFees = fees ? JSON.parse(fees) : null;

    // Validate fees object
    if (!parsedFees || !parsedFees.appointment || !parsedFees.consultation || 
        !parsedFees.caseDetails || !parsedFees.videoCall || !parsedFees.caseHandling) {
      return res.status(400).json({
        success: false,
        message: "All fee types are required",
        required: ['appointment', 'consultation', 'caseDetails', 'videoCall', 'caseHandling'],
        received: parsedFees
      });
    }

    // Find user in User schema
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register as a user first."
      });
    }

    // Parse the location data from the form
    const locationData = JSON.parse(req.body.location || '{}');
    const officeLocationData = JSON.parse(req.body.officeLocation || '{}');

    // Create or update lawyer data
    const lawyerData = {
      userId: user._id,
      fullName: fullname,
      email: email.toLowerCase(),
      phone,
      AEN,
      specialization: specialization.trim(),
      location: {
        address: locationData.address || "",
        lat: locationData.lat || null,
        lng: locationData.lng || null
      },
      officeLocation: {
        address: officeLocationData.address || "",
        lat: officeLocationData.lat || null,
        lng: officeLocationData.lng || null
      },
      availability: availability || "Available",
      yearsOfExperience: yearsOfExperience,
      // Set all fee fields
      appointmentFees: `₹${parsedFees.appointment}`,
      consultationFees: `₹${parsedFees.consultation}`,
      caseDetailsFees: `₹${parsedFees.caseDetails}`,
      videoCallFees: `₹${parsedFees.videoCall}`,
      caseHandlingFees: `₹${parsedFees.caseHandling}`,
      fees: `₹${parsedFees.consultation}`, // Set base fee as consultation fee
      visibleToClients: visibleToClients === 'true',
      languagesSpoken: parsedLanguages,
      practicingCourts: parsedCourts,
      isVerified: false
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.profilePicture?.[0]) {
        lawyerData.profilePicture = req.files.profilePicture[0].filename;
      }
      if (req.files.lawDegreeCertificate?.[0]) {
        lawyerData.lawDegreeCertificate = req.files.lawDegreeCertificate[0].filename;
      }
      if (req.files.barCouncilCertificate?.[0]) {
        lawyerData.barCouncilCertificate = req.files.barCouncilCertificate[0].filename;
      }
    }

    // Create or update lawyer
    let lawyer = await Lawyer.findOne({ email: email.toLowerCase() });
    if (lawyer) {
      // Update existing lawyer
      lawyer = await Lawyer.findOneAndUpdate(
        { email: email.toLowerCase() },
        lawyerData,
        { new: true }
      );
    } else {
      // Create new lawyer
      lawyer = new Lawyer(lawyerData);
      await lawyer.save();
    }

    res.status(200).json({
      success: true,
      message: lawyer ? "Lawyer profile updated successfully" : "Lawyer registered successfully",
      lawyer
    });

  } catch (error) {
    console.error("Error in lawyer registration:", error);
    res.status(400).json({
      success: false,
      message: "Error registering lawyer: " + error.message,
      error: error.message
    });
  }
};

// Add new controller method for adding additional certificates
exports.addAdditionalCertificate = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No certificate file provided" });
    }

    const newCertificate = {
      name: req.file.originalname,
      file: req.file.filename,
      description,
    };

    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    lawyer.additionalCertificates.push(newCertificate);
    await lawyer.save();

    res.status(200).json({
      message: "Certificate added successfully",
      certificate: newCertificate,
    });
  } catch (error) {
    console.error("Error adding certificate:", error);
    res
      .status(500)
      .json({ message: "Error adding certificate", error: error.message });
  }
};

// Add new controller method for removing additional certificates
exports.removeAdditionalCertificate = async (req, res) => {
  try {
    const { lawyerId, certificateId } = req.params;

    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    lawyer.additionalCertificates = lawyer.additionalCertificates.filter(
      (cert) => cert._id.toString() !== certificateId
    );

    await lawyer.save();

    res.status(200).json({
      message: "Certificate removed successfully",
    });
  } catch (error) {
    console.error("Error removing certificate:", error);
    res
      .status(500)
      .json({ message: "Error removing certificate", error: error.message });
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
