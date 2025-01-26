const Analytics = require("../models/Analytics");
const User = require("../models/User");
const Lawyer = require("../models/lawyerModel");

const updateAnalytics = async () => {
  try {
    // Calculate metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLoginDate: { $gte: thirtyDaysAgo },
    });
    const userTypes = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const userTypeCount = {
      clients: 0,
      lawyers: 0,
      admins: 0,
    };

    userTypes.forEach((type) => {
      const role = type._id.toLowerCase();
      if (userTypeCount.hasOwnProperty(role)) {
        userTypeCount[role] = type.count;
      }
    });

    // Lawyer metrics
    const totalLawyers = await Lawyer.countDocuments();
    const verifiedLawyers = await Lawyer.countDocuments({ isVerified: true });
    const averageRating = await Lawyer.aggregate([
      { $match: { rating: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    // Create new analytics record
    const analytics = new Analytics({
      appointmentMetrics: {
        totalAppointments: 0,
        completedAppointments: 0,
        canceledAppointments: 0,
        pendingAppointments: 0,
      },
      userMetrics: {
        totalUsers,
        activeUsers,
        newUsers: await User.countDocuments({
          createdAt: { $gte: thirtyDaysAgo },
        }),
        userTypes: userTypeCount,
      },
      lawyerMetrics: {
        totalLawyers,
        verifiedLawyers,
        averageRating: averageRating[0]?.avg || 0,
      },
    });

    await analytics.save();
    console.log("Analytics updated successfully");
    return analytics;
  } catch (error) {
    console.error("Error updating analytics:", error);
    throw error;
  }
};

module.exports = { updateAnalytics };
