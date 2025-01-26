const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    userMetrics: {
      totalUsers: Number,
      activeUsers: Number,
      newRegistrations: Number,
      userTypes: {
        clients: Number,
        lawyers: Number,
        admins: Number,
      },
    },
    appointmentMetrics: {
      totalAppointments: Number,
      completedAppointments: Number,
      canceledAppointments: Number,
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
    lawyerMetrics: {
      topPerformers: [
        {
          lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Lawyer" },
          appointments: Number,
          rating: Number,
        },
      ],
      specializations: [
        {
          name: String,
          count: Number,
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
