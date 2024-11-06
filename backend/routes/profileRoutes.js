// profileRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const Profile = require("../models/profileModel"); // Import the Profile model

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  },
});
const upload = multer({ storage });

// GET user profile
// router.get("/", async (req, res) => {
//   try {
//     const userProfile = await Profile.findOne(); // Find the first profile
//     res.json(userProfile);
//   } catch (error) {
//     res.status(500).json({ message: "Error retrieving profile" });
//   }
// });

// GET user profile
router.get("/", async (req, res) => {
    try {
      const userProfile = await Profile.findOne(); // Find the first profile
      res.json(userProfile || {}); // Return an empty object if no profile is found
    } catch (error) {
      res.status(500).json({ message: "Error retrieving profile" });
    }
  });
  
// Create user profile
router.post("/", upload.single("profilePicture"), async (req, res) => {
  const { fullname, email, location, legalNeeds } = req.body;

  try {
    const newProfile = new Profile({
      fullname,
      email,
      location,
      legalNeeds,
      profilePicture: req.file ? req.file.path : null, // Set profile picture path if uploaded
    });

    await newProfile.save(); // Save the profile to the database
    res.status(201).json({ message: "Profile created successfully!", profile: newProfile });
  } catch (error) {
    res.status(500).json({ message: "Error creating profile", error: error.message });
  }
});

// Update user profile
router.put("/", upload.single("profilePicture"), async (req, res) => {
  const { fullname, email, location, legalNeeds } = req.body;

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      {}, // Find the first document (you can customize the query to find a specific user)
      {
        fullname,
        email,
        location,
        legalNeeds,
        profilePicture: req.file ? req.file.path : undefined, // Update if a new profile picture is uploaded
      },
      { new: true }
    );

    res.json({ message: "Profile updated successfully!", profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

module.exports = router;
