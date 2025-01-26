const mongoose = require("mongoose");
const Analytics = require("../models/Analytics");
require("dotenv").config();

const seedData = {
  date: new Date(),
  userMetrics: {
    totalUsers: 0,
    activeUsers: 0,
    newRegistrations: 0,
    userTypes: {
      clients: 0,
      lawyers: 0,
      admins: 0,
    },
  },
  appointmentMetrics: {
    totalAppointments: 0,
    completedAppointments: 0,
    canceledAppointments: 0,
  },
  financialMetrics: {
    totalRevenue: 0,
    lawyerEarnings: 0,
  },
  searchMetrics: {
    keywords: [],
  },
  lawyerMetrics: {
    topPerformers: [],
    specializations: [],
  },
};

mongoose
  .connect(process.env.uri)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Clear existing data
    await Analytics.deleteMany({});

    // Insert seed data
    const analytics = new Analytics(seedData);
    await analytics.save();

    console.log("Analytics data seeded successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding data:", err);
    process.exit(1);
  });
