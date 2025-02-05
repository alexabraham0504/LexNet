const socketIo = require("socket.io");
const http = require("http");
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Set up Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to our router
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle joining chat rooms
  socket.on("join_room", (roomId) => {
    console.log("Client joining room:", roomId);
    socket.join(roomId);
  });

  // Handle sending messages
  socket.on("send_message", (message) => {
    console.log("Broadcasting message to room:", message.chatRoomId);
    socket.to(message.chatRoomId).emit("new_message", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use server.listen instead of app.listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
