const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  loginLimiter,
  registerLimiter,
} = require("../middleware/rateLimitMiddleware");

// Public routes with rate limiters
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);

module.exports = router;
