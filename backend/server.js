const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { initializeSocket } = require("./services/analyticsSocket");
const { updateAnalytics } = require("./services/analyticsService");
const User = require("./models/User");
const Lawyer = require("./models/Lawyer");
const { isAuthenticated } = require("./middleware/auth");

// Import your routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");
const lawyerRegistrationRoutes = require("./routes/lawyerRegistrationRoutes");
const ipcRoutes = require("./routes/ipc");
const lawyerAvailabilityRoutes = require("./routes/lawyerAvailability");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");
const appointmentRoutes = require("./routes/appointments");
const lawyerRoutes = require("./routes/lawyerRoutes");
const messageRoutes = require("./routes/messages");
const lawyerVerificationRoutes = require("./routes/lawyers.js");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware setup
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);


// Root route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Initialize socket.io
const io = socketIO(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: corsOptions.credentials
  }
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join room on connection
  socket.on("join_room", (roomId) => {
    console.log("Client joining room:", roomId);
    socket.join(roomId);
  });

  // Handle new messages
  socket.on("send_message", (message) => {
    console.log("Received message through socket:", message);
    // Only emit to the receiver to prevent duplicates
    socket.to(message.receiverId).emit("new_message", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Store io instance in app
app.set("io", io);

// Update the server startup code
const startServer = async () => {
  try {
    await mongoose.connect(process.env.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully.");

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      updateAnalytics().catch(error => {
        console.error("Error updating initial analytics:", error);
      });
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
        server.listen(PORT + 1);
      } else {
        console.error('Server error:', err);
      }
    });

  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
};

startServer();
