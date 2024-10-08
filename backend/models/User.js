// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, 
  resetPasswordToken: { type: String },  // For password reset
  resetPasswordExpires: { type: Date } ,// Plain text password
});

const User = mongoose.model("Users", userSchema);
module.exports = User;
