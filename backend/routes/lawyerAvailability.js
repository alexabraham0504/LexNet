// const express = require("express");
// const router = express.Router();
// const LawyerAvailability = require("../models/LawyerAvailability");

// // Get availability for a specific date
// router.get("/:lawyerId/:date", async (req, res) => {
//   try {
//     const { lawyerId, date } = req.params;
//     const availability = await LawyerAvailability.findOne({ lawyerId, date });
//     res.json({ availability });
//   } catch (error) {
//     console.error("Error fetching availability:", error);
//     res.status(500).json({ message: "Error fetching availability" });
//   }
// });

// // Save new availability
// router.post("/", async (req, res) => {
//   const { lawyerId, date, timeSlots } = req.body;

//   // Add validation and logging
//   console.log("Received request body:", req.body);

//   if (!lawyerId || !date || !timeSlots) {
//     return res.status(400).json({
//       message: "Missing required fields",
//       received: { lawyerId, date, timeSlots },
//     });
//   }

//   try {
//     // Log the search criteria
//     console.log("Searching for existing availability with:", {
//       lawyerId,
//       date,
//     });

//     // Check if availability exists for the same lawyer and date
//     const existing = await LawyerAvailability.findOne({ lawyerId, date });
//     console.log("Existing availability:", existing);

//     if (existing) {
//       // Update existing availability
//       console.log("Updating existing availability");
//       existing.timeSlots = timeSlots;
//       const updated = await existing.save();
//       console.log("Updated successfully:", updated);
//       return res.status(200).json({
//         message: "Availability updated successfully.",
//         availability: updated,
//       });
//     }

//     // Save new availability
//     console.log("Creating new availability");
//     const availability = new LawyerAvailability({
//       lawyerId,
//       date,
//       timeSlots,
//     });

//     const saved = await availability.save();
//     console.log("Saved successfully:", saved);

//     res.status(201).json({
//       message: "Availability saved successfully.",
//       availability: saved,
//     });
//   } catch (error) {
//     console.error("Error saving availability:", error);
//     console.error("Error details:", {
//       name: error.name,
//       message: error.message,
//       stack: error.stack,
//     });
//     res.status(500).json({
//       message: "An error occurred while saving availability.",
//       error: error.message,
//     });
//   }
// });

// // Update existing availability
// router.put("/:id", async (req, res) => {
//   try {
//     const { timeSlots } = req.body;
//     const availability = await LawyerAvailability.findByIdAndUpdate(
//       req.params.id,
//       { timeSlots },
//       { new: true }
//     );
//     res.json({ message: "Availability updated successfully", availability });
//   } catch (error) {
//     console.error("Error updating availability:", error);
//     res.status(500).json({ message: "Error updating availability" });
//   }
// });

// // Delete availability
// router.delete("/:id", async (req, res) => {
//   try {
//     await LawyerAvailability.findByIdAndDelete(req.params.id);
//     res.json({ message: "Availability deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting availability:", error);
//     res.status(500).json({ message: "Error deleting availability" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const LawyerAvailability = require("../models/LawyerAvailability");

// Get availability for a specific date (lawyer can see their own availability)
router.get("/:lawyerId/:date", async (req, res) => {
  try {
    const { lawyerId, date } = req.params;
    const availability = await LawyerAvailability.findOne({ lawyerId, date });
    res.json({ availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Error fetching availability" });
  }
});

// Save new availability (lawyer can add their own availability)
router.post("/", async (req, res) => {
  const { lawyerId, date, timeSlots } = req.body;

  // Add validation and logging
  if (!lawyerId || !date || !timeSlots) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  try {
    // Check if availability exists for the same lawyer and date
    const existing = await LawyerAvailability.findOne({ lawyerId, date });

    if (existing) {
      // Update existing availability
      existing.timeSlots = timeSlots;
      const updated = await existing.save();
      return res.status(200).json({
        message: "Availability updated successfully.",
        availability: updated,
      });
    }

    // Save new availability
    const availability = new LawyerAvailability({
      lawyerId,
      date,
      timeSlots,
    });

    const saved = await availability.save();
    res.status(201).json({
      message: "Availability saved successfully.",
      availability: saved,
    });
  } catch (error) {
    console.error("Error saving availability:", error);
    res.status(500).json({
      message: "An error occurred while saving availability.",
      error: error.message,
    });
  }
});

// Update existing availability (lawyer can update their own availability)
router.put("/:id", async (req, res) => {
  try {
    const { timeSlots } = req.body;
    const availability = await LawyerAvailability.findByIdAndUpdate(
      req.params.id,
      { timeSlots },
      { new: true }
    );
    res.json({ message: "Availability updated successfully", availability });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Error updating availability" });
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
    const availability = await LawyerAvailability.findOne({ lawyerId, date: new Date(date) });

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
