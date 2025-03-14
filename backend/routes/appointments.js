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
      appointmentType,
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

    // Check if the time slot is available based on appointment type
    const availability = await LawyerAvailability.findOne({
      lawyerId,
      date: new Date(appointmentDate),
    });

    // Check availability based on appointment type
    const isAvailable = appointmentType === 'videoCall' 
      ? availability && availability.videoCallTimeSlots.includes(appointmentTime)
      : availability && availability.timeSlots.includes(appointmentTime);

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Selected time slot is not available for ${appointmentType === 'videoCall' ? 'video call' : 'in-person'} appointment`,
      });
    }

    // Check for existing appointments with the same time slot (regardless of type)
    // This prevents double bookings across appointment types
    const existingAppointment = await Appointment.findOne({
      lawyerId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $ne: "cancelled" },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot has already been booked for another appointment",
      });
    }

    // Create new appointment with type
    const appointment = new Appointment({
      lawyerId,
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      appointmentType: appointmentType || 'inPerson', // Default to in-person if not specified
      notes,
      status: "pending",
    });

    await appointment.save();

    // When an appointment is booked, remove the time slot from both types of availability
    // to prevent double bookings
    const updateData = {};
    
    if (appointmentType === 'videoCall') {
      // If it's a video call appointment, remove the slot from video call slots
      updateData.videoCallTimeSlots = availability.videoCallTimeSlots.filter(
        slot => slot !== appointmentTime
      );
    } else {
      // If it's an in-person appointment, remove the slot from in-person slots
      updateData.timeSlots = availability.timeSlots.filter(
        slot => slot !== appointmentTime
      );
    }
    
    // Update the availability document
    await LawyerAvailability.findByIdAndUpdate(
      availability._id,
      updateData
    );

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

// Add this new route to get appointments for a specific date
router.get("/date/:lawyerId/:date", async (req, res) => {
  try {
    const { lawyerId, date } = req.params;
    
    // Parse the date string to a Date object
    const queryDate = new Date(date);
    
    // Set the time to midnight to ensure we're only comparing dates
    queryDate.setHours(0, 0, 0, 0);
    
    // Find appointments where the date matches exactly
    const appointments = await Appointment.find({ 
      lawyerId, 
      appointmentDate: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000) // Next day
      }
    });
    
    res.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments for date:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching appointments for date",
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
