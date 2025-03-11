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
            // Create today's date at start of day in UTC
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            
            // Create value date at start of day in UTC
            const valueDate = new Date(value);
            valueDate.setUTCHours(0, 0, 0, 0);
            
            console.log('Validation - Today UTC:', today.toISOString());
            console.log('Validation - Value UTC:', valueDate.toISOString());
            console.log('Validation - Today local:', today.toString());
            console.log('Validation - Value local:', valueDate.toString());
            
            // Fix: The issue is that the date is being converted incorrectly
            // We need to extract the date parts and create a new UTC date
            const valueParts = valueDate.toISOString().split('T')[0].split('-');
            const year = parseInt(valueParts[0]);
            const month = parseInt(valueParts[1]) - 1; // Month is 0-indexed
            const day = parseInt(valueParts[2]);
            
            // Create a new date with these parts
            const correctedDate = new Date(Date.UTC(year, month, day));
            console.log('Validation - Corrected UTC date:', correctedDate.toISOString());
            
            // Compare with today
            const result = correctedDate >= today;
            console.log('Validation - Corrected comparison result:', result);
            
            return result;
          },
          message: "Cannot set availability for past dates"
        },
        {
          validator: function(value) {
            // Fix weekend validation too
            const valueParts = new Date(value).toISOString().split('T')[0].split('-');
            const year = parseInt(valueParts[0]);
            const month = parseInt(valueParts[1]) - 1; // Month is 0-indexed
            const day = parseInt(valueParts[2]);
            
            // Create a new date with these parts
            const correctedDate = new Date(Date.UTC(year, month, day));
            const day_of_week = correctedDate.getUTCDay();
            
            return day_of_week !== 0 && day_of_week !== 6;
          },
          message: "Cannot set availability for weekends"
        }
      ],
      // Update the setter to handle dates correctly
      set: function(date) {
        if (typeof date === 'string') {
          // Parse the date string (YYYY-MM-DD)
          const [year, month, day] = date.split('-').map(Number);
          
          // Create date at midnight UTC
          return new Date(Date.UTC(year, month - 1, day));
        }
        if (date instanceof Date) {
          // If it's already a Date, ensure it's at midnight UTC
          const year = date.getFullYear();
          const month = date.getMonth();
          const day = date.getDate();
          return new Date(Date.UTC(year, month, day));
        }
        return date;
      }
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
    videoCallTimeSlots: {
      type: [String],
      default: [],
      validate: [
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
        }
      ],
    }
  },
  {
    timestamps: true, // Add timestamps for tracking
  }
);

// Ensure unique combination of lawyerId and date
LawyerAvailabilitySchema.index({ lawyerId: 1, date: 1 }, { unique: true });

// Update validation to prevent overlapping slots
LawyerAvailabilitySchema.pre('save', function(next) {
  // Check for overlapping slots
  const overlappingSlots = this.timeSlots.filter(slot => 
    this.videoCallTimeSlots.includes(slot)
  );
  
  if (overlappingSlots.length > 0) {
    // Instead of just logging a warning, throw an error to prevent saving
    const error = new Error(`Cannot set the same time slot for both in-person and video call consultations: ${overlappingSlots.join(', ')}`);
    return next(error);
  }
  
  next();
});

const LawyerAvailability = mongoose.model(
  "LawyerAvailability",
  LawyerAvailabilitySchema
);

module.exports = LawyerAvailability;
