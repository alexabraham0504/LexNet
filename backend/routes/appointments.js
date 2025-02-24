const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const LawyerAvailability = require("../models/LawyerAvailability");
const { isAuthenticated } = require('../middleware/auth');

// Create new appointment
router.post("/", async (req, res) => {
  try {
    const {
      lawyerId,
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate,
      appointmentTime,
      notes,
    } = req.body;

    // Validation checks
    if (
      !lawyerId ||
      !clientName ||
      !clientEmail ||
      !clientPhone ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Phone validation (assuming Indian phone numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(clientPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    // Check if the time slot is available
    const availability = await LawyerAvailability.findOne({
      lawyerId,
      date: new Date(appointmentDate),
    });

    if (!availability || !availability.timeSlots.includes(appointmentTime)) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
    }

    // Check for existing appointments
    const existingAppointment = await Appointment.findOne({
      lawyerId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $ne: "cancelled" },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot has already been booked",
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      lawyerId,
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      notes,
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error booking appointment",
      error: error.message,
    });
  }
});

// Get appointments for a lawyer
router.get("/lawyer/:lawyerId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      lawyerId: req.params.lawyerId,
    }).sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
});

// Cancel appointment
router.put("/cancel/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment is in the past
    if (new Date(appointment.appointmentDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel past appointments",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message,
    });
  }
});

// Update appointment status
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Validate status
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating appointment status",
      error: error.message,
    });
  }
});

// Get appointments for a client
router.get("/client/:email", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      clientEmail: req.params.email
    })
    .sort({ appointmentDate: -1, appointmentTime: 1 })
    .populate('lawyerId', 'fullname'); // This will get the lawyer's name

    // Format the response to include lawyer name
    const formattedAppointments = appointments.map(apt => ({
      ...apt._doc,
      lawyerName: apt.lawyerId.fullname
    }));

    res.json({ 
      success: true, 
      appointments: formattedAppointments 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message
    });
  }
});

// Request appointment reschedule
router.post("/reschedule/:id", async (req, res) => {
  try {
    const { reason, proposedDate, proposedTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be rescheduled"
      });
    }

    // Check if the proposed time slot is available
    const existingAppointment = await Appointment.findOne({
      lawyerId: appointment.lawyerId,
      appointmentDate: new Date(proposedDate),
      appointmentTime: proposedTime,
      status: { $ne: "cancelled" },
      _id: { $ne: appointment._id }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Proposed time slot is already booked"
      });
    }

    // Update appointment with reschedule request
    appointment.rescheduleRequest = {
      requested: true,
      reason,
      proposedDate: new Date(proposedDate),
      proposedTime,
      status: 'pending'
    };

    await appointment.save();

    res.json({
      success: true,
      message: "Reschedule request submitted successfully",
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error requesting reschedule",
      error: error.message
    });
  }
});

// Handle reschedule request (approve/reject)
router.put("/reschedule/:id/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (!appointment.rescheduleRequest.requested) {
      return res.status(400).json({
        success: false,
        message: "No reschedule request found for this appointment"
      });
    }

    if (action === 'approve') {
      // Update appointment with new date and time
      appointment.appointmentDate = appointment.rescheduleRequest.proposedDate;
      appointment.appointmentTime = appointment.rescheduleRequest.proposedTime;
      appointment.rescheduleRequest.status = 'approved';
    } else if (action === 'reject') {
      appointment.rescheduleRequest.status = 'rejected';
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action"
      });
    }

    await appointment.save();

    res.json({
      success: true,
      message: `Reschedule request ${action}ed successfully`,
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error handling reschedule request",
      error: error.message
    });
  }
});

router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Implement appointment fetching logic here
    // For now, return empty array to prevent errors
    res.json([]);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      message: 'Error fetching appointments',
      error: error.message 
    });
  }
});

module.exports = router;
