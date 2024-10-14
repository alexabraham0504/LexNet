// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String },  // Not required for Google Sign-In
  googleId: { type: String },  // Field for storing Google ID
  profilePicture: { type: String },  // Field for storing Google profile picture URL
  resetPasswordToken: { type: String },  // For password reset
  resetPasswordExpires: { type: Date } ,// Plain text password
  role: { type: String, enum: ['Client', 'Lawyer'], default: 'Client' },
});

const User = mongoose.model("Users", userSchema);
module.exports = User;
