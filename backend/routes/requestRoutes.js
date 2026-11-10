const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
} = require("../controllers/requestController");
const {
  updateRequestStatus,
  assignRequest,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All request routes require authentication
router.use(protect);

// Student / General request endpoints
router.route("/").post(createRequest).get(getRequests);

router
  .route("/:id")
  .get(getRequestById)
  .put(updateRequest)
  .delete(deleteRequest);

// Admin-only management endpoints
router.put("/:id/status", authorize("admin"), updateRequestStatus);
router.put("/:id/assign", authorize("admin"), assignRequest);

module.exports = router;
