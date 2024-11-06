// models/IPCSection.js
const mongoose = require("mongoose");

const IPCSectionSchema = new mongoose.Schema({
  section: { type: String, required: true },
  description: { type: String, required: true },
  caseStudy: { type: String, default: "" },
});

const IPCSection = mongoose.model("IPCSection", IPCSectionSchema);

module.exports = IPCSection;
