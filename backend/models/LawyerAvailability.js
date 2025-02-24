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
      validate: [
        {
          validator: function(value) {
            // Ensure date is not in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return value >= today;
          },
          message: "Cannot set availability for past dates"
        },
        {
          validator: function(value) {
            // Check if the date is a weekend
            const day = value.getDay();
            return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
          },
          message: "Cannot set availability for weekends"
        }
      ]
    },
    timeSlots: {
      type: [String],
      required: true,
      validate: [
        {
          validator: function(slots) {
            return slots.length > 0;
          },
          message: "Time slots array cannot be empty",
        },
        {
          validator: function(slots) {
            // Validate that all slots are in the correct format (HH:00)
            return slots.every(slot => {
              const [hours] = slot.split(':');
              const hour = parseInt(hours);
              return hour >= 9 && hour <= 17 && slot.endsWith(':00');
            });
          },
          message: "Time slots must be on the hour between 9:00 and 17:00",
        },
        {
          validator: function(slots) {
            // Ensure slots are unique
            const uniqueSlots = new Set(slots);
            return uniqueSlots.size === slots.length;
          },
          message: "Duplicate time slots are not allowed",
        },
        {
          validator: function(slots) {
            // Ensure slots are in chronological order
            const sortedSlots = [...slots].sort();
            return JSON.stringify(sortedSlots) === JSON.stringify(slots);
          },
          message: "Time slots must be in chronological order",
        }
      ],
    },
  },
  {
    timestamps: true, // Add timestamps for tracking
  }
);

// Add index for faster queries
LawyerAvailabilitySchema.index({ lawyerId: 1, date: 1 }, { unique: true });

const LawyerAvailability = mongoose.model(
  "LawyerAvailability",
  LawyerAvailabilitySchema
);

module.exports = LawyerAvailability;
