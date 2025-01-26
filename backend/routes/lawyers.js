// routes/lawyers.js
const express = require("express");
const router = express.Router();
const Lawyer = require("../models/lawyerModel");

// Route to get unverified lawyers
router.get("/unverified", async (req, res) => {
  try {
    const lawyers = await Lawyer.find({
      isVerified: false,
    });
    res.json(lawyers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unverified lawyers." });
  }
});

// Route to get verified lawyers
router.get("/verified", async (req, res) => {
  try {
    const lawyers = await Lawyer.find({
      isVerified: true,
    });
    res.json(lawyers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch verified lawyers." });
  }
});

// Route to approve a lawyer
router.put("/approve/:id", async (req, res) => {
  try {
    const lawyer = await Lawyer.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }
    res.json({ message: "Lawyer approved successfully", lawyer });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve lawyer" });
  }
});

// Route to reject a lawyer
router.delete("/reject/:id", async (req, res) => {
  try {
    const lawyer = await Lawyer.findByIdAndDelete(req.params.id);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }
    res.json({ message: "Lawyer rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject lawyer" });
  }
});

// Toggle visibility route
router.put("/toggle-visibility/:id", async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    lawyer.visibleToClients = !lawyer.visibleToClients;
    await lawyer.save();

    res.json({
      success: true,
      message: `Lawyer ${
        lawyer.visibleToClients ? "activated" : "deactivated"
      } successfully`,
      visibleToClients: lawyer.visibleToClients,
    });
  } catch (error) {
    console.error("Error in toggle visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update visibility status",
    });
  }
});

module.exports = router;
