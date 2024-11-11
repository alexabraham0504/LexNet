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
