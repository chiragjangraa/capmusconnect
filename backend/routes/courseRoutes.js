const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All course routes require authentication (Student or Admin)
router.use(protect);

// Public / Authenticated read routes
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Admin-only management routes
router.post("/", authorize("admin"), createCourse);
router.put("/:id", authorize("admin"), updateCourse);
router.delete("/:id", authorize("admin"), deleteCourse);

module.exports = router;
