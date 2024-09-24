// server.js
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file

const authRoutes = require("./routes/auth"); // Import auth routes

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Middleware
app.use(express.json()); // For parsing application/json
app.use("/auth", authRoutes); // Use auth routes at /auth

// Example route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
