const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  appointmentMetrics: {
    totalAppointments: {
      type: Number,
      default: 0,
    },
    completedAppointments: {
      type: Number,
      default: 0,
    },
    canceledAppointments: {
      type: Number,
      default: 0,
    },
    pendingAppointments: {
      type: Number,
      default: 0,
    },
  },
  userMetrics: {
    totalUsers: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    newUsers: {
      type: Number,
      default: 0,
    },
    userTypes: {
      clients: {
        type: Number,
        default: 0,
      },
      lawyers: {
        type: Number,
        default: 0,
      },
      admins: {
        type: Number,
        default: 0,
      },
    },
  },
  lawyerMetrics: {
    totalLawyers: {
      type: Number,
      default: 0,
    },
    verifiedLawyers: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
  },
  financialMetrics: {
    totalRevenue: Number,
    lawyerEarnings: Number,
  },
  searchMetrics: {
    keywords: [
      {
        term: String,
        count: Number,
      },
    ],
  },
});

module.exports = mongoose.model("Analytics", analyticsSchema);
