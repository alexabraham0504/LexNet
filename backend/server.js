// // server.js
// const express = require("express");
// const mongoose = require("mongoose");
// require("dotenv").config(); // Load environment variables from .env file

// const authRoutes = require("./routes/auth"); // Import auth routes

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Connect to MongoDB Atlas
// mongoose
//   .connect(process.env.uri, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log("MongoDB connected successfully.");
//   })
//   .catch((err) => {
//     console.error("MongoDB connection error:", err);
//   });

// // Middleware
// app.use(express.json()); // For parsing application/json
// app.use("/auth", authRoutes); // Use auth routes at /auth

// // Example route
// app.get("/", (req, res) => {
//   res.send("Server is running.");
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

// server.js
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const cors=require("cors"); // Import auth routes

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.uri)  // No need for useNewUrlParser or useUnifiedTopology
  .then(() => {
    console.log("MongoDB connected successfully.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Middleware
app.use(express.json()); // For parsing application/json
app.use("/auth", authRoutes); // Use auth routes at /auth
app.use(cors({
  origin: ["http://localhost:3001"],
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true // Allows cookies to be sent with the request
}));
// Example route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials1." });
    }

    // Compare plain text password
    if (user.password !== password) {
      return res.status(400).json({ message: "password is wrong" });
    }
    else{
    res.status(200).json({ message: "Login successful." })};
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/register", async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password, // Store password directly
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  }
    else{
      res.status(200).json({ message: "User already registered" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
