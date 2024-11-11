const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  Uid: { type: String, required: true, unique: true },
  role: { type: String, default: "User" }, // Default role can be 'User' or customize as needed
});

module.exports = mongoose.model("GUser", userSchema);