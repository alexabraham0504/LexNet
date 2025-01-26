const express = require("express");
const router = express.Router();
const Analytics = require("../models/Analytics");
const User = require("../models/User");
const Lawyer = require("../models/lawyerModel");

// Get user activity metrics
router.get("/users", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLoginDate: { $gte: thirtyDaysAgo },
    });
    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const userTypes = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      activeUsers,
      newRegistrations,
      userTypes: Object.fromEntries(
        userTypes.map(({ _id, count }) => [_id.toLowerCase(), count])
      ),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment metrics
router.get("/appointments", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const metrics = await Analytics.findOne(query)
      .select("appointmentMetrics")
      .sort({ date: -1 });

    res.json(metrics?.appointmentMetrics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial metrics
router.get("/financial", async (req, res) => {
  try {
    const metrics = await Analytics.findOne()
      .select("financialMetrics")
      .sort({ date: -1 });

    res.json(metrics?.financialMetrics || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lawyer performance metrics
router.get("/lawyers", async (req, res) => {
  try {
    const lawyers = await Lawyer.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userid",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          fullname: 1,
          email: 1,
          phone: 1,
          specialization: 1,
          rating: 1,
          appointments: 1,
          isVerified: 1,
          createdAt: { $ifNull: ["$userDetails.createdAt", "$createdAt"] },
          userCreatedAt: "$userDetails.createdAt",
        },
      },
    ]).exec();

    console.log("Fetched lawyers count:", lawyers.length);

    const metrics = {
      totalLawyers: lawyers.length,
      verifiedLawyers: lawyers.filter((l) => l.isVerified).length,
      averageRating:
        lawyers.reduce((sum, lawyer) => sum + (lawyer.rating || 0), 0) /
          lawyers.length || 0,
    };

    res.json({
      topLawyers: lawyers,
      metrics,
      specializations: lawyers.reduce((acc, lawyer) => {
        if (lawyer.specialization) {
          acc[lawyer.specialization] = (acc[lawyer.specialization] || 0) + 1;
        }
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching lawyer metrics:", error);
    res.status(500).json({
      error: error.message,
      topLawyers: [],
      metrics: {
        totalLawyers: 0,
        verifiedLawyers: 0,
        averageRating: 0,
      },
      specializations: {},
    });
  }
});

// Get clients
router.get("/clients", async (req, res) => {
  try {
    // First, let's check what roles exist in the database
    const allRoles = await User.distinct("role");
    console.log("Available roles in database:", allRoles);

    // Try different possible role values
    const clients = await User.find({
      $or: [
        { role: "client" },
        { role: "Client" },
        { role: "USER" },
        { role: "user" },
      ],
    })
      .select("fullname email phone createdAt isActive role")
      .sort({ createdAt: -1 })
      .lean();

    console.log("Fetched clients:", clients);

    if (clients.length === 0) {
      // If no clients found, let's check all users to debug
      const allUsers = await User.find({})
        .select("fullname email phone createdAt isActive role")
        .lean();
      console.log("All users in database:", allUsers);
    }

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      error: error.message,
      clients: [],
    });
  }
});

module.exports = router;
