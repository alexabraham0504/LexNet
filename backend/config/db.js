const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    if (err.name === "MongooseServerSelectionError") {
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
      return;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
