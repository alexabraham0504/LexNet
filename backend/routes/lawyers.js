// // // routes/lawyers.js
// // const express = require("express");
// // const router = express.Router();
// // const Lawyer = require("../models/lawyerModel");
// // const mongoose = require("mongoose");
// // const fs = require("fs");

// // // Route to get unverified lawyers
// // router.get("/unverified", async (req, res) => {
// //   try {
// //     const lawyers = await Lawyer.find({
// //       isVerified: false,
// //     }).select('-__v'); // Select all fields except __v
    
// //     console.log("Backend - Found unverified lawyers:", lawyers);
    
// //     if (!lawyers || lawyers.length === 0) {
// //       console.log("No unverified lawyers found");
// //       return res.json([]);
// //     }

// //     // Transform and validate each lawyer object
// //     const transformedLawyers = lawyers.map(lawyer => {
// //       const lawyerObj = lawyer.toObject();
// //       return {
// //         _id: lawyerObj._id,
// //         fullName: lawyerObj.fullName || 'Unknown',
// //         email: lawyerObj.email || 'No email',
// //         phone: lawyerObj.phone || 'No phone',
// //         AEN: lawyerObj.AEN || 'No AEN',
// //         specialization: lawyerObj.specialization || 'Not specified',
// //         location: lawyerObj.location || 'Not specified',
// //         fees: lawyerObj.fees || '₹0',
// //         profilePicture: lawyerObj.profilePicture || null,
// //         lawDegreeCertificate: lawyerObj.lawDegreeCertificate || null,
// //         barCouncilCertificate: lawyerObj.barCouncilCertificate || null,
// //         additionalCertificates: lawyerObj.additionalCertificates || [],
// //         isVerified: false,
// //         visibleToClients: lawyerObj.visibleToClients || false
// //       };
// //     });

// //     console.log("Sending transformed lawyers:", transformedLawyers);
// //     res.json(transformedLawyers);
// //   } catch (error) {
// //     console.error("Error in /unverified route:", error);
// //     res.status(500).json({ 
// //       message: "Failed to fetch unverified lawyers.",
// //       error: error.message 
// //     });
// //   }
// // });

// // // Route to get verified lawyers
// // router.get("/verified", async (req, res) => {
// //   try {
// //     const lawyers = await Lawyer.find({
// //       isVerified: true
// //     }).select('-__v');
    
// //     console.log("Raw lawyers from DB:", lawyers);
    
// //     // Transform the data with explicit field mapping
// //     const transformedLawyers = lawyers.map(lawyer => {
// //       const lawyerObj = lawyer.toObject();
      
// //       // Validate profile picture path
// //       const profilePicture = lawyerObj.profilePicture 
// //         ? (fs.existsSync(`uploads/${lawyerObj.profilePicture}`) 
// //           ? lawyerObj.profilePicture 
// //           : null)
// //         : null;
      
// //       return {
// //         _id: lawyerObj._id,
// //         fullName: lawyerObj.fullName || 'Unknown',
// //         email: lawyerObj.email || 'No email',
// //         phone: lawyerObj.phone || 'No phone',
// //         AEN: lawyerObj.AEN || 'No AEN',
// //         specialization: lawyerObj.specialization || 'Not specified',
// //         location: lawyerObj.location || 'Not specified',
// //         fees: lawyerObj.fees || '₹0',
// //         profilePicture: profilePicture,
// //         lawDegreeCertificate: lawyerObj.lawDegreeCertificate || null,
// //         barCouncilCertificate: lawyerObj.barCouncilCertificate || null,
// //         additionalCertificates: lawyerObj.additionalCertificates || [],
// //         isVerified: true,
// //         visibleToClients: lawyerObj.visibleToClients || false,
// //         isActive: lawyerObj.isActive || true
// //       };
// //     });

// //     console.log("Sending transformed lawyers:", transformedLawyers);
// //     res.json(transformedLawyers);
// //   } catch (error) {
// //     console.error("Error in /verified route:", error);
// //     res.status(500).json({ 
// //       message: "Failed to fetch verified lawyers.",
// //       error: error.message 
// //     });
// //   }
// // });

// // // Route to approve a lawyer
// // router.put("/approve/:id", async (req, res) => {
// //   try {
// //     const lawyer = await Lawyer.findByIdAndUpdate(
// //       req.params.id,
// //       { isVerified: true },
// //       { new: true }
// //     );
// //     if (!lawyer) {
// //       return res.status(404).json({ message: "Lawyer not found" });
// //     }
// //     res.json({ message: "Lawyer approved successfully", lawyer });
// //   } catch (error) {
// //     res.status(500).json({ message: "Failed to approve lawyer" });
// //   }
// // });

// // // Route to reject a lawyer
// // router.delete("/reject/:id", async (req, res) => {
// //   try {
// //     const lawyer = await Lawyer.findByIdAndDelete(req.params.id);
// //     if (!lawyer) {
// //       return res.status(404).json({ message: "Lawyer not found" });
// //     }
// //     res.json({ message: "Lawyer rejected successfully" });
// //   } catch (error) {
// //     res.status(500).json({ message: "Failed to reject lawyer" });
// //   }
// // });

// // // Toggle visibility route
// // router.put("/toggle-visibility/:id", async (req, res) => {
// //   try {
// //     console.log("Toggling visibility for lawyer ID:", req.params.id);
    
// //     // Validate the ID
// //     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
// //       return res.status(400).json({ 
// //         success: false,
// //         message: "Invalid lawyer ID format" 
// //       });
// //     }

// //     // Find the lawyer
// //     const lawyer = await Lawyer.findById(req.params.id);
    
// //     if (!lawyer) {
// //       return res.status(404).json({ 
// //         success: false,
// //         message: "Lawyer not found" 
// //       });
// //     }

// //     // Toggle visibility
// //     lawyer.visibleToClients = !lawyer.visibleToClients;
// //     await lawyer.save();

// //     console.log("Successfully updated lawyer:", lawyer);

// //     res.json({
// //       success: true,
// //       message: `Lawyer ${lawyer.visibleToClients ? "activated" : "deactivated"} successfully`,
// //       lawyer: lawyer
// //     });

// //   } catch (error) {
// //     console.error("Error in toggle visibility:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to update visibility status",
// //       error: error.message
// //     });
// //   }
// // });

// // // Get lawyer profile by user ID
// // router.get("/profile/:userId", async (req, res) => {
// //   try {
// //     console.log("Finding lawyer for userId:", req.params.userId);

// //     // Convert string ID to ObjectId
// //     const userObjectId = new mongoose.Types.ObjectId(req.params.userId);

// //     const lawyer = await Lawyer.findOne({ userId: userObjectId }).populate(
// //       "userId",
// //       "fullName email role"
// //     );

// //     if (!lawyer) {
// //       console.log("No lawyer found for userId:", req.params.userId);
// //       return res.status(404).json({ message: "Lawyer not found" });
// //     }

// //     console.log("Found lawyer:", lawyer);
// //     res.json(lawyer);
// //   } catch (error) {
// //     console.error("Error fetching lawyer profile:", error);
// //     res.status(500).json({ message: "Error fetching lawyer profile" });
// //   }
// // });

// // module.exports = router;


// // routes/lawyers.js
// const express = require("express");
// const router = express.Router();
// const Lawyer = require("../models/lawyerModel");

// // Route to get unverified lawyers
// router.get("/unverified", async (req, res) => {
//   try {
//     const lawyers = await Lawyer.find({
//       isVerified: false,
//     }).select('-__v');
    
//     console.log("Raw lawyers from DB:", lawyers);
    
//     if (!lawyers || lawyers.length === 0) {
//       return res.json([]);
//     }

//     // Transform and validate each lawyer object
//     const transformedLawyers = lawyers.map(lawyer => {
//       const lawyerObj = lawyer.toObject();
//       console.log("Individual lawyer object:", lawyerObj);
//       return {
//         _id: lawyerObj._id,
//         fullName: lawyerObj.fullName,
//         email: lawyerObj.email,
//         phone: lawyerObj.phone,
//         AEN: lawyerObj.AEN,
//         specialization: lawyerObj.specialization,
//         location: lawyerObj.location,
//         fees: lawyerObj.fees,
//         profilePicture: lawyerObj.profilePicture,
//         lawDegreeCertificate: lawyerObj.lawDegreeCertificate,
//         barCouncilCertificate: lawyerObj.barCouncilCertificate,
//         additionalCertificates: lawyerObj.additionalCertificates || [],
//         isVerified: false,
//         visibleToClients: lawyerObj.visibleToClients
//       };
//     });

//     console.log("Transformed lawyers:", transformedLawyers);
//     res.json(transformedLawyers);
//   } catch (error) {
//     console.error("Error in /unverified route:", error);
//     res.status(500).json({ 
//       message: "Failed to fetch unverified lawyers.",
//       error: error.message 
//     });
//   }
// });

// // Route to get verified lawyers
// router.get("/verified", async (req, res) => {
//   try {
//     const lawyers = await Lawyer.find({
//       isVerified: true,
//     }).select('-__v');
    
//     console.log("Found verified lawyers:", lawyers);
    
//     if (!lawyers || lawyers.length === 0) {
//       return res.json([]);
//     }

//     // Transform and validate each lawyer object - same transformation as unverified
//     const transformedLawyers = lawyers.map(lawyer => {
//       const lawyerObj = lawyer.toObject();
//       return {
//         _id: lawyerObj._id,
//         fullName: lawyerObj.fullName || 'Unknown',
//         email: lawyerObj.email || 'No email',
//         phone: lawyerObj.phone || 'No phone',
//         AEN: lawyerObj.AEN || 'No AEN',
//         specialization: lawyerObj.specialization || 'Not specified',
//         location: lawyerObj.location || 'Not specified',
//         fees: lawyerObj.fees || '₹0',
//         profilePicture: lawyerObj.profilePicture || null,
//         lawDegreeCertificate: lawyerObj.lawDegreeCertificate || null,
//         barCouncilCertificate: lawyerObj.barCouncilCertificate || null,
//         additionalCertificates: lawyerObj.additionalCertificates || [],
//         isVerified: true,
//         visibleToClients: lawyerObj.visibleToClients || false
//       };
//     });

//     console.log("Sending transformed verified lawyers:", transformedLawyers);
//     res.json(transformedLawyers);
//   } catch (error) {
//     console.error("Error in /verified route:", error);
//     res.status(500).json({ 
//       message: "Failed to fetch verified lawyers.",
//       error: error.message 
//     });
//   }
// });

// // Route to approve a lawyer
// router.put("/approve/:id", async (req, res) => {
//   try {
//     const lawyer = await Lawyer.findByIdAndUpdate(
//       req.params.id,
//       { isVerified: true },
//       { new: true }
//     );
//     if (!lawyer) {
//       return res.status(404).json({ message: "Lawyer not found" });
//     }
//     res.json({ message: "Lawyer approved successfully", lawyer });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to approve lawyer" });
//   }
// });

// // Route to reject a lawyer
// router.delete("/reject/:id", async (req, res) => {
//   try {
//     const lawyer = await Lawyer.findByIdAndDelete(req.params.id);
//     if (!lawyer) {
//       return res.status(404).json({ message: "Lawyer not found" });
//     }
//     res.json({ message: "Lawyer rejected successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to reject lawyer" });
//   }
// });

// // Toggle visibility route
// router.put("/toggle-visibility/:id", async (req, res) => {
//   try {
//     const lawyer = await Lawyer.findById(req.params.id);
//     if (!lawyer) {
//       return res.status(404).json({ message: "Lawyer not found" });
//     }

//     lawyer.visibleToClients = !lawyer.visibleToClients;
//     await lawyer.save();

//     res.json({
//       success: true,
//       message: `Lawyer ${
//         lawyer.visibleToClients ? "activated" : "deactivated"
//       } successfully`,
//       visibleToClients: lawyer.visibleToClients,
//     });
//   } catch (error) {
//     console.error("Error in toggle visibility:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update visibility status",
//     });
//   }
// });

// module.exports = router;


// // routes/lawyers.js
// const express = require("express");
// const router = express.Router();
// const Lawyer = require("../models/Lawyer"); // Assuming Lawyer model is in models directory

// // Route to get list of lawyers
// router.get("/", async (req, res) => {
//   try {
//     const lawyers = await Lawyer.find(); // Fetch all lawyers
//     res.json(lawyers);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch lawyers." });
//   }
// });

// module.exports = router;

// routes/lawyers.js
const express = require("express");
const router = express.Router();
const Lawyer = require("../models/Lawyer");

// Route to get verified lawyers visible to clients
router.get("/verified", async (req, res) => {
  try {
    const lawyers = await Lawyer.find({ isVerified: true, visibleToClients: true });
    res.json(lawyers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch verified lawyers." });
  }
});

module.exports = router;
