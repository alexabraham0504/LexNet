require('dotenv').config();
const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const path = require('path');
const multer = require('multer');
const Case = require("./models/caseModel");
const { isAuthenticated } = require("./middleware/auth");
const { visionService } = require('./services/visionService');
const { bertService } = require('./services/bertService');
const Meeting = require('./models/meetingModel');

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
const caseRoutes = require('./routes/caseRoutes');
const translationRoutes = require('./routes/translationRoutes');
const documentRoutes = require("./routes/documents");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware setup
const allowedOrigins = [
  'http://localhost:3000', // Adjust this to match your client URL
  // Add other origins as needed
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.text({ limit: '50mb' }));
app.use("/uploads", express.static("./uploads"));
app.use('/uploads', express.static('uploads'));

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
app.use('/api/cases', caseRoutes);
app.use('/api/translation', translationRoutes);
app.use("/api/documents", documentRoutes);

app.post('/api/lawyers/sendMeetingId', async (req, res) => {
    const { lawyerId, roomName, clientName, clientId } = req.body;

    try {
        // Validate input
        if (!lawyerId || !roomName || !clientName || !clientId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Save meeting information to database
        const newMeeting = new Meeting({
            roomName,
            lawyerId,
            clientName,
            clientId,
            status: 'pending'
        });

        await newMeeting.save();

        // Emit an event to notify the lawyer about the incoming call
        const io = req.app.get("io");
        io.to(lawyerId).emit("incomingCall", {
            roomName,
            clientName,
            clientId: req.body.clientId
        });

        // Respond with success
        res.status(200).json({ 
            message: 'Meeting ID sent successfully',
            meeting: newMeeting
        });
    } catch (error) {
        console.error("Error sending meeting ID:", error);
        res.status(500).json({ message: 'Failed to send meeting ID', error: error.message });
    }
});

// Add new endpoint to fetch meetings for a lawyer
app.get('/api/lawyers/meetingIds/:lawyerId', async (req, res) => {
    try {
        const meetings = await Meeting.find({ 
            lawyerId: req.params.lawyerId,
            status: 'pending'
        }).sort({ createdAt: -1 });
        
        res.json(meetings);
    } catch (error) {
        console.error("Error fetching meeting IDs:", error);
        res.status(500).json({ message: 'Failed to fetch meeting IDs' });
    }
});

// Root route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Initialize socket.io
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
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

  socket.on('offer', ({ offer, roomName }) => {
    socket.to(roomName).emit('offer', { offer });
  });

  socket.on('answer', ({ answer, roomName }) => {
    socket.to(roomName).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ candidate, roomName }) => {
    socket.to(roomName).emit('ice-candidate', { candidate });
  });

  socket.on("incomingCall", ({ roomName, clientName, lawyerId }) => {
    socket.to(lawyerId).emit("incomingCall", {
      roomName,
      clientName
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Store io instance in app
app.set("io", io);

// Analytics function
async function updateAnalytics() {
  try {
    // Get total cases
    const totalCases = await Case.countDocuments({ isDeleted: false });
    
    // Get cases by type
    const casesByType = await Case.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$caseType', count: { $sum: 1 } } }
    ]);

    // Get recent activity
    const recentActivity = await Case.find({ isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(5);

    console.log('Analytics updated:', {
      totalCases,
      casesByType,
      recentActivity: recentActivity.length
    });

    return {
      totalCases,
      casesByType,
      recentActivity
    };
  } catch (error) {
    console.error('Error updating analytics:', error);
    throw error;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

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
      updateAnalytics().then(analytics => {
        console.log('Initial analytics loaded');
      }).catch(error => {
        console.error('Failed to load initial analytics:', error);
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

// Periodic analytics updates (every 5 minutes)
setInterval(() => {
  updateAnalytics()
    .then(analytics => {
      console.log('Analytics updated successfully');
    })
    .catch(error => {
      console.error('Failed to update analytics:', error);
    });
}, 5 * 60 * 1000);

// Add this near your other server setup code
const cleanupExpiredMeetings = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await Meeting.deleteMany({
      createdAt: { $lt: tenMinutesAgo }
    });
    console.log('Cleaned up expired meetings');
  } catch (error) {
    console.error('Failed to cleanup meetings:', error);
  }
};

// Run cleanup every minute
setInterval(cleanupExpiredMeetings, 60000);

// Add initial cleanup when server starts
app.on('ready', () => {
  cleanupExpiredMeetings();
});

startServer();

module.exports = app;
