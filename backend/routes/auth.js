// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const router = express.Router();
require("dotenv").config(); 
const bcrypt = require('bcrypt');


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
      res.status(200).json({ message: "Login successful." })};
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error." });
    }
  });


router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: 'Password Reset Request',
      text: `Please click the link to reset your password: http://localhost:3000/reset-password/${resetToken}`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'Reset link sent to email' });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/resetpassword/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Log the received token and password
  console.log("Token received in request:", token);
  console.log("Password received:", password);

  if (!password) {
    return res.status(400).send({ message: "Password is required" });
  }

  try {
    // Find the user with the matching token and ensure the token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log(`Token: ${token}, Date.now(): ${Date.now()}`);
      const tokenInDb = await User.findOne({ resetPasswordToken: token });
      console.log('Token found in DB:', tokenInDb?.resetPasswordToken);
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    // Log user found and proceed to reset password
    console.log("User found:", user);

    // Set the new password directly (not hashed)
    user.password = password; // Direct assignment of plain text password
    user.resetPasswordToken = undefined; // Clear the token
    user.resetPasswordExpires = undefined; // Clear the expiration time

    // Save the updated user details
    await user.save();

    res.status(200).send({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send({ message: "Internal server error", error: error.message }); // Include error details in the response
  }
});




module.exports = router;
