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