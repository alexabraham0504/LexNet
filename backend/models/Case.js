const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: 'Open' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true }, // Make sure this is correct
    createdAt: { type: Date, default: Date.now },
});

const Case = mongoose.model('Case', caseSchema);
module.exports = Case;
