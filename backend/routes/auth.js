// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const router = express.Router();
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User1 = require("../models/Guser");

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
    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

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
      phone: phone || "", // Make phone optional
      password: hashedPassword,
      role,
      isVerified: false,
      status: "pending",
    });

    // Save the user to the database
    await newUser.save();

    // Generate a verification token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    try {
      console.log(process.env.EMAIL);
      console.log(newUser.email);
      // Send verification email
      const verificationLink = `http://localhost:3000/verify/${token}`;
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: newUser.email,
        subject: "Email Verification - Lex Net",
        html: `
          <p>Hi ${newUser.fullName},</p>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Even if email fails, user is registered
      return res.status(201).json({
        success: true,
        message:
          "Registration successful, but verification email could not be sent. Please contact support.",
      });
    }

    // Send success response
    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Detailed server error during registration:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed. Please try again later.",
    });
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
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password"
      });
    }

    console.log("Login attempt for:", email);

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Special checks for Lawyer role
    if (user.role === "Lawyer") {
      if (!user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Please verify your email before logging in"
        });
      }

      if (user.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Your account is pending approval. Please wait for admin approval."
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send success response
    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again later."
    });
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
    // Validate action
    if (!["suspend", "activate"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be either 'suspend' or 'activate'",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update status based on action
    user.status = action === "suspend" ? "suspended" : "approved";

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been ${action}d successfully`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(`Error in ${action} user:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to ${action} user`,
      error: error.message,
    });
  }
});

//gmail account
//Google

router.post("/google-login", async (req, res) => {
  const { displayName, Uid, email, role } = req.body;

  try {
    // Check if the user already exists in the database
    let user = await User1.findOne({ Uid });

    if (!user) {
      // If user does not exist, create a new one
      user = new User1({
        displayName,
        email,
        Uid,
        role,
      });
      await user.save();
    }

    res.status(200).json({ message: "User authenticated and saved", user });
  } catch (error) {
    console.error("Error verifying user data:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

module.exports = router;
