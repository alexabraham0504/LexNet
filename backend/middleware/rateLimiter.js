const rateLimit = require('express-rate-limit');

// Create a rate limiter for Gemini API calls
const geminiLimiter = rateLimit({
  windowMs: 60 * 10000, // 1 minute
  max: 20, // Reduced from 10 to 5 requests per minute to stay within Gemini limits
  message: {
    success: false,
    message: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipFailedRequests: true, // Don't count failed requests
});

module.exports = {
  geminiLimiter
}; 