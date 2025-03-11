const express = require("express");
const router = express.Router();
const LawyerAvailability = require("../models/LawyerAvailability");

// Get availability for a specific date (lawyer can see their own availability)
router.get("/:lawyerId/:date", async (req, res) => {
  try {
    const { lawyerId, date } = req.params;
    console.log("GET AVAILABILITY: Received request for lawyerId:", lawyerId, "date:", date);
    
    // Parse the date string (YYYY-MM-DD) into year, month, day
    const [year, month, day] = date.split('-').map(Number);
    
    // Create date at start of day in UTC
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
    
    console.log("GET AVAILABILITY: Start date UTC:", startDate.toISOString());
    console.log("GET AVAILABILITY: End date UTC:", endDate.toISOString());
    
    // Find availability for exact date
    const availability = await LawyerAvailability.findOne({ 
      lawyerId, 
      date: {
        $gte: startDate,
        $lt: endDate
      }
    });
    
    console.log("GET AVAILABILITY: Found availability:", availability ? "Yes" : "No");
    if (availability) {
      console.log("GET AVAILABILITY: Availability date UTC:", availability.date.toISOString());
    }
    
    res.json({ availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Error fetching availability" });
  }
});

// Save new availability (lawyer can add their own availability)
router.post("/", async (req, res) => {
  const { lawyerId, date, timeSlots, videoCallTimeSlots } = req.body;
  console.log("BACKEND POST: Received request to save availability");
  console.log("BACKEND POST: Request body:", req.body);

  if (!lawyerId || !date || !timeSlots) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  try {
    // Parse the date string (YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number);
    
    // Create date at midnight UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    
    console.log("BACKEND POST: Input date string:", date);
    console.log("BACKEND POST: Created UTC date:", utcDate.toISOString());
    console.log("BACKEND POST: UTC date components:", {
      year: utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth() + 1,
      day: utcDate.getUTCDate()
    });
    console.log("BACKEND POST: Local date string:", utcDate.toString());

    // Check for existing availability with exact date match
    const existingAvailability = await LawyerAvailability.findOne({
      lawyerId,
      date: {
        $gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
        $lt: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))
      }
    });

    let result;
    if (existingAvailability) {
      // Update existing
      existingAvailability.timeSlots = timeSlots;
      existingAvailability.videoCallTimeSlots = videoCallTimeSlots || [];
      result = await existingAvailability.save();
    } else {
      // Create new
      const availability = new LawyerAvailability({
        lawyerId,
        date: utcDate,
        timeSlots,
        videoCallTimeSlots: videoCallTimeSlots || []
      });
      result = await availability.save();
    }

    return res.status(200).json({
      message: "Availability saved successfully.",
      availability: result,
    });
  } catch (error) {
    console.error("BACKEND POST ERROR:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
        error: error.toString()
      });
    }
    res.status(500).json({
      message: "An error occurred while saving availability.",
      error: error.toString()
    });
  }
});

// Update existing availability (lawyer can update their own availability)
router.put("/:id", async (req, res) => {
  try {
    const { timeSlots, videoCallTimeSlots } = req.body;
    
    // Get the existing availability
    const existingAvailability = await LawyerAvailability.findById(req.params.id);
    if (!existingAvailability) {
      return res.status(404).json({ message: "Availability not found" });
    }
    
    // Check if we're trying to delete all slots
    const isEmptyingTimeSlots = timeSlots && timeSlots.length === 0;
    const isEmptyingVideoCallSlots = videoCallTimeSlots && videoCallTimeSlots.length === 0;
    
    // If we're trying to empty both types of slots, delete the record instead
    if (isEmptyingTimeSlots && isEmptyingVideoCallSlots) {
      await LawyerAvailability.findByIdAndDelete(req.params.id);
      return res.json({ message: "Availability deleted successfully" });
    }
    
    // If we're trying to empty just one type, make sure the other type has slots
    if (isEmptyingTimeSlots && (!existingAvailability.videoCallTimeSlots || existingAvailability.videoCallTimeSlots.length === 0)) {
      await LawyerAvailability.findByIdAndDelete(req.params.id);
      return res.json({ message: "Availability deleted successfully" });
    }
    
    if (isEmptyingVideoCallSlots && (!existingAvailability.timeSlots || existingAvailability.timeSlots.length === 0)) {
      await LawyerAvailability.findByIdAndDelete(req.params.id);
      return res.json({ message: "Availability deleted successfully" });
    }
    
    // Check for overlapping slots
    if (timeSlots && videoCallTimeSlots) {
      const overlappingSlots = timeSlots.filter(slot => 
        videoCallTimeSlots.includes(slot)
      );
      
      if (overlappingSlots.length > 0) {
        return res.status(400).json({
          message: `Cannot set the same time slot for both in-person and video call consultations: ${overlappingSlots.join(', ')}`,
        });
      }
    }
    
    const updateData = {};
    if (timeSlots !== undefined) {
      updateData.timeSlots = timeSlots;
    }
    
    if (videoCallTimeSlots !== undefined) {
      updateData.videoCallTimeSlots = videoCallTimeSlots;
    }
    
    const availability = await LawyerAvailability.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({ message: "Availability updated successfully", availability });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: error.message || "Error updating availability" });
  }
});

// Delete availability (lawyer can delete their own availability)
router.delete("/:id", async (req, res) => {
  try {
    await LawyerAvailability.findByIdAndDelete(req.params.id);
    res.json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({ message: "Error deleting availability" });
  }
});

// Get availability for a particular lawyer and date
router.get("/availability/:lawyerId", async (req, res) => {
  const { lawyerId } = req.params;
  const { date } = req.query;

  try {
    // Parse the date string to a Date object
    const queryDate = new Date(date);
    
    // Set the time to midnight to ensure we're only comparing dates
    queryDate.setHours(0, 0, 0, 0);
    
    // Find availability where the date matches exactly
    const availability = await LawyerAvailability.findOne({ 
      lawyerId, 
      date: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000) // Next day
      }
    });

    if (!availability) {
      return res.status(404).json({ message: "No availability found for this date." });
    }

    res.status(200).json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Error fetching availability." });
  }
});

module.exports = router;
