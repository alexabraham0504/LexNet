const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
require("dotenv").config();
const { initializeSocket } = require("./services/analyticsSocket");
const { updateAnalytics } = require("./services/analyticsService");

// Import your routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");
const lawyerRegistrationRoutes = require("./routes/lawyerRegistrationRoutes");
const ipcRoutes = require("./routes/ipc");
const lawyerAvailabilityRoutes = require("./routes/lawyerAvailability");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");

const lawyerRoutes = require("./routes/lawyers");

// Initialize Express app
const app = express();
const server = http.createServer(app);
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
    origin: "http://localhost:3000",
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
app.use("/api/lawyer/availability", lawyerAvailabilityRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

app.use("/api/lawyers", lawyerRoutes);
// app.use("/api/law", lawyerRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Initialize socket.io
initializeSocket(server);

// Initial analytics update when server starts
server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await updateAnalytics();
    console.log("Initial analytics updated");
  } catch (error) {
    console.error("Error updating initial analytics:", error);
  }
});
