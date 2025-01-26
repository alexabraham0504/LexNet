const socketIo = require("socket.io");
const { updateAnalytics } = require("./analyticsService");

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

  // Update analytics every 5 minutes
  setInterval(async () => {
    try {
      const metrics = await updateAnalytics();
      io.emit("analytics_update", metrics);
    } catch (error) {
      console.error("Error sending real-time metrics:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

module.exports = { initializeSocket };
