const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const LawyerAvailability = require("../models/LawyerAvailability");

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

module.exports = router;
