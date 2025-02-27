const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    lawyerId: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Meeting', meetingSchema); 