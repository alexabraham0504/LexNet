const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    lawyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lawyer',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    lawyerName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'completed'],
        default: 'pending'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema); 