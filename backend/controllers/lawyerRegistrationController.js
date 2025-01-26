const Lawyer = require("../models/lawyerModel");
const User = require("../models/User");
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
        isExisting: true,
      });
    }

    res.status(200).json({
      ...userDetails,
      isExisting: false,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res
      .status(500)
      .json({ message: "Error fetching user details", error: error.message });
  }
};

// Register lawyer with pre-filled data
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
      visibleToClients,
      certificateDescriptions,
    } = req.body;

    // Verify user exists in User schema
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found in system" });
    }

    // Create or update lawyer profile
    const lawyerData = {
      fullname,
      email,
      phone,
      AEN,
      specialization,
      location,
      availability,
      fees,
      visibleToClients: visibleToClients === "true",
      userid: user._id,
    };

    // Handle file uploads
    if (req.files) {
      if (req.files["profilePicture"]?.[0]) {
        lawyerData.profilePicture = req.files["profilePicture"][0].filename;
      }
      if (req.files["lawDegreeCertificate"]?.[0]) {
        lawyerData.lawDegreeCertificate =
          req.files["lawDegreeCertificate"][0].filename;
      }
      if (req.files["barCouncilCertificate"]?.[0]) {
        lawyerData.barCouncilCertificate =
          req.files["barCouncilCertificate"][0].filename;
      }
      // Handle additional certificates
      if (req.files["additionalCertificates"]) {
        const additionalCerts = req.files["additionalCertificates"].map(
          (file, index) => ({
            name: file.originalname,
            file: file.filename,
            description: certificateDescriptions
              ? JSON.parse(certificateDescriptions)[index]
              : "",
          })
        );
        lawyerData.additionalCertificates = additionalCerts;
      }
    }

    const existingLawyer = await Lawyer.findOne({ email });
    let lawyer;

    if (existingLawyer) {
      // Update existing lawyer profile while preserving isVerified status and existing certificates
      lawyer = await Lawyer.findOneAndUpdate(
        { email },
        {
          ...lawyerData,
          isVerified: existingLawyer.isVerified,
          additionalCertificates: [
            ...(existingLawyer.additionalCertificates || []),
            ...(lawyerData.additionalCertificates || []),
          ],
        },
        { new: true }
      );
    } else {
      lawyer = new Lawyer(lawyerData);
      await lawyer.save();
    }

    res.status(200).json({
      message: existingLawyer
        ? "Profile updated successfully"
        : "Lawyer registered successfully",
      lawyer,
    });
  } catch (error) {
    console.error("Error in lawyer registration:", error);
    res
      .status(500)
      .json({ message: "Error in lawyer registration", error: error.message });
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
