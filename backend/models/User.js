// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  googleId: { type: String }, // Field for storing Google ID
  profilePicture: { type: String }, // Field for storing Google profile picture URL
  resetPasswordToken: { type: String }, // For password reset
  resetPasswordExpires: { type: Date }, // Plain text password
  role: {
    type: String,
    enum: ["Admin", "Lawyer", "Client", "User"],
    default: "Client",
  },
  isVerified: { type: Boolean, default: false }, // Add this field
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Change "Users" to "User"
const User = mongoose.model("User", userSchema);
module.exports = User;
