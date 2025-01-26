const socketIo = require("socket.io");
const User = require("../models/User");
const Lawyer = require("../models/lawyerModel");
const Analytics = require("../models/Analytics");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected to analytics");

    socket.on("disconnect", () => {
      console.log("Client disconnected from analytics");
    });
  });

  // Set up periodic updates
  setInterval(async () => {
    try {
      const metrics = await calculateRealTimeMetrics();
      io.emit("analytics_update", metrics);
    } catch (error) {
      console.error("Error sending real-time metrics:", error);
    }
  }, 5000); // Update every 5 seconds
};

const calculateRealTimeMetrics = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [userMetrics, lawyerMetrics, appointmentMetrics] = await Promise.all([
      // User metrics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $gt: ["$lastLoginDate", thirtyDaysAgo] }, 1, 0],
              },
            },
            userTypes: {
              $push: "$role",
            },
          },
        },
      ]),

      // Lawyer metrics
      Lawyer.aggregate([
        { $match: { isVerified: true } },
        {
          $group: {
            _id: null,
            totalLawyers: { $sum: 1 },
            averageRating: { $avg: "$rating" },
            specializations: {
              $addToSet: "$specialization",
            },
          },
        },
      ]),

      // Get latest analytics record for appointment metrics
      Analytics.findOne().sort({ date: -1 }).select("appointmentMetrics"),
    ]);

    // Process user types
    const userTypeCount = {
      clients: 0,
      lawyers: 0,
      admins: 0,
    };

    if (userMetrics[0]?.userTypes) {
      userMetrics[0].userTypes.forEach((role) => {
        userTypeCount[role.toLowerCase()]++;
      });
    }

    return {
      userMetrics: {
        totalUsers: userMetrics[0]?.totalUsers || 0,
        activeUsers: userMetrics[0]?.activeUsers || 0,
        userTypes: userTypeCount,
      },
      appointmentMetrics: appointmentMetrics?.appointmentMetrics || {
        totalAppointments: 0,
        completedAppointments: 0,
        canceledAppointments: 0,
      },
      lawyerMetrics: {
        totalLawyers: lawyerMetrics[0]?.totalLawyers || 0,
        averageRating: lawyerMetrics[0]?.averageRating || 0,
        specializations: lawyerMetrics[0]?.specializations || [],
      },
    };
  } catch (error) {
    console.error("Error calculating real-time metrics:", error);
    return null;
  }
};

module.exports = { initializeSocket };
