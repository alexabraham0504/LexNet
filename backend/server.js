const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

// Import your routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");
const lawyerRegistrationRoutes = require("./routes/lawyerRegistrationRoutes");
const ipcRoutes = require("./routes/ipc");
const caseRoutes = require("./routes/caseRoutes");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware setup
app.use(
  cors({
    origin: ["https://lexnet.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("./uploads"));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Passport initialization and configuration
app.use(passport.initialize());
app.use(passport.session());

// Define API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/lawyers", lawyerRegistrationRoutes);
app.use("/api/ipc", ipcRoutes);
app.use("/api/cases", caseRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
