const express = require('express');
const router = express.Router();
const Meeting = require('../../models/Meeting'); // Make sure this path is correct
const Lawyer = require('../../models/Lawyer'); // Add this line at the top

// Add this route to handle meeting cleanup
router.get('/meetingIds/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Delete expired meetings
    await Meeting.deleteMany({
      lawyerId,
      createdAt: { $lt: tenMinutesAgo }
    });

    // Get remaining active meetings
    const meetings = await Meeting.find({
      lawyerId,
      createdAt: { $gte: tenMinutesAgo }
    });

    res.json(meetings);
  } catch (error) {
    console.error('Error handling meetings:', error);
    res.status(500).json({ error: 'Failed to process meetings' });
  }
});

// Get meetings for a lawyer
router.get('/meetings/:lawyerId', async (req, res) => {
    try {
        const { lawyerId } = req.params;
        
        if (!lawyerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Lawyer ID is required' 
            });
        }

        console.log('Fetching meetings for lawyer:', lawyerId); // Debug log

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const meetings = await Meeting.find({
            lawyerId,
            createdAt: { $gte: tenMinutesAgo },
            status: { $in: ['pending', 'accepted'] }
        })
        .sort({ createdAt: -1 })
        .select('clientName roomName status createdAt clientId _id');

        console.log('Found meetings:', meetings); // Debug log

        res.json({
            success: true,
            meetings: meetings || []
        });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch meetings',
            error: error.message 
        });
    }
});

// Add the sendMeetingId endpoint
router.post('/sendMeetingId', async (req, res) => {
    try {
        const { lawyerId, roomName, clientName, clientId, status } = req.body;
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

// Add accept meeting endpoint
router.post('/acceptMeeting', async (req, res) => {
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

// Add decline meeting endpoint
router.post('/declineMeeting', async (req, res) => {
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

// Add this route to handle lawyer search
router.get('/', async (req, res) => {
    try {
        const { specialization, ipcSection } = req.query;
        console.log('Searching lawyers with:', { specialization, ipcSection });

        // Build the query
        let query = {};
        if (specialization) {
            query.specialization = specialization;
        }
        if (ipcSection) {
            query.ipcSections = ipcSection;
        }

        // Find lawyers matching the criteria
        const lawyers = await Lawyer.find(query)
            .select('userid fullName specialization experience rating location availability profileImage')
            .lean();

        console.log(`Found ${lawyers.length} lawyers`);

        res.json({
            success: true,
            lawyers: lawyers.map(lawyer => ({
                ...lawyer,
                id: lawyer.userid || lawyer._id,
                profileImage: lawyer.profileImage || '/default-avatar.png'
            }))
        });

    } catch (error) {
        console.error('Error searching lawyers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search lawyers',
            error: error.message
        });
    }
});

// Make sure this route is properly exported
module.exports = router; 