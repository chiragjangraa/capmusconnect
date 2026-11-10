const { rateLimit } = require("express-rate-limit");

/**
 * Evaluates whether rate limiting should be bypassed
 * Production and development environments ALWAYS enforce rate limits.
 * Automated test suites running with NODE_ENV='test' are permitted unless
 * they explicitly request rate limit verification with 'x-test-rate-limit'.
 */
const shouldSkip = (req) => {
  if (req.headers["x-test-rate-limit"]) {
    return false;
  }
  return process.env.NODE_ENV === "test";
};

/**
 * Rate limiter for authentication login endpoint:
 * Maximum 5 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  skip: shouldSkip,
  validate: {
    trustProxy: false,
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts from this IP address. Please try again after 15 minutes.",
    });
  },
});

/**
 * Rate limiter for student registration endpoint:
 * Maximum 10 account registrations per 1 hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  skip: shouldSkip,
  validate: {
    trustProxy: false,
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many registration attempts from this IP address. Please try again after 1 hour.",
    });
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
