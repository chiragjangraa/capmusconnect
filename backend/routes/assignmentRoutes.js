const express = require("express");
const router = express.Router();
const {
  getAllAssignments,
  getAssignmentById,
  submitAssignment,
  createAssignment,
  updateAssignment,
  gradeSubmission,
  deleteAssignment,
} = require("../controllers/assignmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All assignment routes require authentication
router.use(protect);

// Student & Admin accessible routes
router.get("/", getAllAssignments);
router.get("/:id", getAssignmentById);
router.post("/:id/submit", submitAssignment);

// Admin-only management routes
router.post("/", authorize("admin"), createAssignment);
router.put("/:id", authorize("admin"), updateAssignment);
router.put("/:id/grade", authorize("admin"), gradeSubmission);
router.delete("/:id", authorize("admin"), deleteAssignment);

module.exports = router;
