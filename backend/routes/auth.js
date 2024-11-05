// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const router = express.Router();
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// Nodemailer setup (using Gmail as an example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.PASSWORD, // Your email password or app-specific password
  },
});

// Register route
router.post("/register", async (req, res) => {
  const { fullName, email, phone, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role,
      isVerified: false,
      status: "pending"
    });

    // Save the user to the database
    await newUser.save();

    // Generate a verification token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send verification email
    const verificationLink = `http://localhost:3000/verify/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: newUser.email,
      subject: "Email Verification - Lex Net",
      html: `<p>Hi ${newUser.fullName},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
    });

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." }); // Changed to a valid status code (500)
  }
});

// Email verification route
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Find the user and update the verification status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

// Login route
router.post("/login", async (req, res) => {
  console.log("Request body:", req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Compare plain text password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Password is wrong." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send response with token and user details
    res.status(200).json({
      message: "Login successful.",
      token, // Include the token in the response
      role: user.role,
      firstName: user.firstName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

// Forgot password route
router.post("/forgot-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      text: `Please click the link to reset your password: http://localhost:3000/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error sending email" });
      }
      res.status(200).json({ message: "Reset link sent to email" });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password route
router.post("/resetpassword/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

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
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    // Set the new password directly (not hashed)
    user.password = password; // Direct assignment of plain text password
    user.resetPasswordToken = undefined; // Clear the token
    user.resetPasswordExpires = undefined; // Clear the expiration time

    await user.save();

    res.status(200).send({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

//Admin-USER MANAGEMENT

// Fetch all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Approve or Reject a lawyer registration
router.post("/users/:userId/approve", async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (action === "approve") {
      user.status = "approved";
    } else if (action === "reject") {
      user.status = "rejected";
    }

    await user.save();
    res.status(200).json({ message: `User ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// Suspend or Activate User Account
router.post("/users/:userId/:action", async (req, res) => {
  const { userId, action } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (action === "suspend") {
      user.status = "suspended";
      await user.save();
      res.status(200).json({ message: "User suspended successfully" });
    } else if (action === "activate") {
      user.status = "approved"; // Or whatever active status you use
      await user.save();
      res.status(200).json({ message: "User activated successfully" });
    } else if (action === "delete") {
      await User.findByIdAndDelete(userId);
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to perform account action" });
  }
});




module.exports = router;
