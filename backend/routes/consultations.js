const express = require("express");
const router = express.Router();
const ConsultationRequest = require("../models/ConsultationRequest");
const { isAuthenticated } = require('../middleware/auth');
const User = require("../models/User");
const Lawyer = require("../models/Lawyer");

// Create a new consultation request
router.post("/request", isAuthenticated, async (req, res) => {
  try {
    const {
      lawyerId,
      clientId,
      clientName,
      lawyerName,
      roomName,
      message,
      status
    } = req.body;

    // Validation
    if (!lawyerId || !clientId || !clientName || !lawyerName || !roomName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Create new consultation request
    const consultationRequest = new ConsultationRequest({
      lawyerId,
      clientId,
      clientName,
      lawyerName,
      roomName,
      message: message || "Request for video consultation",
      status: status || "pending"
    });

    await consultationRequest.save();

    // Notify the lawyer about the new request (this could be done via socket.io)
    // Implementation depends on your notification system

    res.status(201).json({
      success: true,
      message: "Consultation request sent successfully",
      consultationRequest
    });
  } catch (error) {
    console.error("Error creating consultation request:", error);
    res.status(500).json({
      success: false,
      message: "Error creating consultation request",
      error: error.message
    });
  }
});

// Get all consultation requests for a lawyer
router.get("/lawyer/:lawyerId", isAuthenticated, async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    const consultationRequests = await ConsultationRequest.find({ 
      lawyerId,
      status: { $in: ["pending", "accepted"] }
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      consultationRequests
    });
  } catch (error) {
    console.error("Error fetching consultation requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching consultation requests",
      error: error.message
    });
  }
});

// Get all consultation requests for a client
router.get("/client/:clientId", isAuthenticated, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const consultationRequests = await ConsultationRequest.find({ 
      clientId,
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      consultationRequests
    });
  } catch (error) {
    console.error("Error fetching client consultation requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching consultation requests",
      error: error.message
    });
  }
});

// Update consultation request status (accept/decline)
router.put("/:requestId/status", isAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, scheduledTime } = req.body;
    
    if (!["pending", "accepted", "declined", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    
    const consultationRequest = await ConsultationRequest.findById(requestId);
    
    if (!consultationRequest) {
      return res.status(404).json({
        success: false,
        message: "Consultation request not found"
      });
    }
    
    consultationRequest.status = status;
    
    if (scheduledTime && status === "accepted") {
      consultationRequest.scheduledTime = new Date(scheduledTime);
    }
    
    await consultationRequest.save();
    
    // Notify the client about the status update (via socket.io)
    // Implementation depends on your notification system
    
    res.json({
      success: true,
      message: `Consultation request ${status}`,
      consultationRequest
    });
  } catch (error) {
    console.error("Error updating consultation request:", error);
    res.status(500).json({
      success: false,
      message: "Error updating consultation request",
      error: error.message
    });
  }
});

// Start a video call for an accepted consultation
router.post("/:requestId/start", isAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const consultationRequest = await ConsultationRequest.findById(requestId);
    
    if (!consultationRequest) {
      return res.status(404).json({
        success: false,
        message: "Consultation request not found"
      });
    }
    
    if (consultationRequest.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Cannot start a call for a consultation that hasn't been accepted"
      });
    }
    
    // Return the room information for the video call
    res.json({
      success: true,
      roomName: consultationRequest.roomName,
      clientName: consultationRequest.clientName,
      lawyerName: consultationRequest.lawyerName
    });
  } catch (error) {
    console.error("Error starting consultation:", error);
    res.status(500).json({
      success: false,
      message: "Error starting consultation",
      error: error.message
    });
  }
});

module.exports = router; 