const mongoose = require("mongoose");

const LawyerAvailabilitySchema = new mongoose.Schema(
  {
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlots: {
      type: [String],
      required: true,
      validate: {
        validator: function (slots) {
          return slots.length > 0;
        },
        message: "Time slots array cannot be empty",
      },
    },
  },
  {
    timestamps: true, // Add timestamps for tracking
  }
);

// Add index for faster queries
LawyerAvailabilitySchema.index({ lawyerId: 1, date: 1 });

const LawyerAvailability = mongoose.model(
  "LawyerAvailability",
  LawyerAvailabilitySchema
);

module.exports = LawyerAvailability;
