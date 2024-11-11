const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Assuming clients are stored in User model
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Lawyer", required: false }, // Lawyer is optional during case creation
  status: { type: String, default: "Open" }, // Status could be "Open", "In Progress", "Closed", etc.
  documents: [{ type: String }], // Array to store paths to uploaded documents
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Case", caseSchema);
