// routes/auth.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Register route
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  
  try {
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password, // Store password directly
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

// Login route
router.post("/login", async (req, res) => {
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
    res.json({ message: "Login successful." })};
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
