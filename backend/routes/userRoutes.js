// Test authentication route
router.get('/test-auth', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
}); 