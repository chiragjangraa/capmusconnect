const express = require("express");
const router = express.Router();
const {
  getAllRequests,
  getDashboardStats,
  getAllStudents,
  getStudentById,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All admin routes require authentication and role 'admin'
router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/requests", getAllRequests);
router.get("/students", getAllStudents);
router.get("/students/:id", getStudentById);

module.exports = router;
