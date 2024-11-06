// models/profileModel.js
const mongoose = require("mongoose");

// Define the schema for the user profile
const profileSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
  },
  location: {
    type: String,
    required: false,
  },
  legalNeeds: {
    type: String,
    required: false,
  },
  profilePicture: {
    type: String,
    required: false, // Store the file path of the uploaded profile picture
  },
});

// Create a model based on the schema
const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
