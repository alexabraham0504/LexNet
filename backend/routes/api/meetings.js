const express = require('express');
const router = express.Router();
const Meeting = require('../../models/Meeting');
const { isAuthenticated } = require('../../middleware/auth');

// Create a new meeting
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { lawyerId, roomName, clientName, clientId, lawyerName, status } = req.body;
        console.log('Received meeting request:', { lawyerId, roomName, clientName, clientId, status });

        // Validate required fields
        if (!lawyerId || !roomName || !clientName || !clientId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                receivedData: { lawyerId, roomName, clientName, clientId }
            });
        }

        // Create new meeting
        const newMeeting = new Meeting({
            roomName,
            lawyerId,
            clientId,
            clientName,
            lawyerName,
            status: status || 'pending'
        });

        const savedMeeting = await newMeeting.save();
        console.log('Meeting saved:', savedMeeting);

        // Get socket.io instance
        const io = req.app.get('io');
        if (io) {
            io.to(lawyerId).emit('incomingCall', {
                roomName,
                clientName,
                clientId,
                meetingId: savedMeeting._id,
                createdAt: savedMeeting.createdAt
            });
        }

        res.status(200).json({
            success: true,
            message: 'Meeting created successfully',
            meeting: savedMeeting
        });

    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create meeting',
            error: error.message
        });
    }
});

// Get meeting by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        res.json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meeting',
            error: error.message
        });
    }
});

// Get meeting by room name
router.get('/room/:roomName', isAuthenticated, async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ roomName: req.params.roomName });
        
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        res.json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error('Error fetching meeting details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meeting details',
            error: error.message
        });
    }
});

// Accept meeting
router.post('/accept', isAuthenticated, async (req, res) => {
    try {
        const { meetingId, lawyerId } = req.body;
        
        const meeting = await Meeting.findOneAndUpdate(
            { _id: meetingId, lawyerId },
            { status: 'accepted' },
            { new: true }
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(meeting.clientId).emit('callAccepted', {
                roomName: meeting.roomName,
                meetingId: meeting._id
            });
        }

        res.json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error('Error accepting meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept meeting'
        });
    }
});

// Decline meeting
router.post('/decline', isAuthenticated, async (req, res) => {
    try {
        const { meetingId } = req.body;
        
        const meeting = await Meeting.findByIdAndUpdate(
            meetingId,
            { status: 'declined' },
            { new: true }
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(meeting.clientId).emit('callDeclined', {
                meetingId: meeting._id
            });
        }

        res.json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error('Error declining meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline meeting'
        });
    }
});

// Get pending meetings for a lawyer
router.get('/pending/:lawyerId', isAuthenticated, async (req, res) => {
    try {
        const meetings = await Meeting.find({
            lawyerId: req.params.lawyerId,
            status: 'pending'
        }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            meetings
        });
    } catch (error) {
        console.error('Error fetching pending meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending meetings',
            error: error.message
        });
    }
});

// Complete a meeting
router.post('/complete', isAuthenticated, async (req, res) => {
    try {
        const { meetingId } = req.body;
        
        const meeting = await Meeting.findByIdAndUpdate(
            meetingId,
            { 
                status: 'completed',
                endTime: new Date()
            },
            { new: true }
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        res.json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error('Error completing meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete meeting',
            error: error.message
        });
    }
});

module.exports = router; 