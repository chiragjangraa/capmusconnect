const mongoose = require("mongoose");
const ServiceRequest = require("../models/ServiceRequest");
const User = require("../models/User");
const { validateStatusTransition } = require("../utils/statusWorkflow");
const { escapeRegex } = require("../utils/regexHelper");

/**
 * @desc    Get all service requests with filtering and search (Admin)
 * @route   GET /api/admin/requests
 * @access  Private (Admin)
 */
const getAllRequests = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const requests = await ServiceRequest.find(query)
      .populate("createdBy", "name email department role")
      .populate("assignedTo", "name email department role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update service request status with strict state machine validation
 * @route   PUT /api/requests/:id/status
 * @access  Private (Admin)
 */
const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, adminResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request ID format: '${id}'.`,
      });
    }

    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        message: "Target status is required in request body.",
      });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    // Validate workflow transition
    const validation = validateStatusTransition(request.status, targetStatus);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        allowedTransitions: validation.allowedTransitions || [],
      });
    }

    // Apply validated transition
    request.status = targetStatus;

    if (typeof adminResponse === "string") {
      request.adminResponse = adminResponse.trim();
    }

    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate("createdBy", "name email department role")
      .populate("assignedTo", "name email department role");

    return res.status(200).json({
      success: true,
      message: `Request status successfully updated to '${targetStatus}'.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign service request to authorized staff/admin user
 * @route   PUT /api/requests/:id/assign
 * @access  Private (Admin)
 */
const assignRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo, adminResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request ID format: '${id}'.`,
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Field 'assignedTo' (staff User ID) is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: `Invalid staff user ID format: '${assignedTo}'.`,
      });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    // Validation: Assigned user must exist and MUST have role 'admin'
    const staffUser = await User.findById(assignedTo);
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: "Assigned staff user does not exist.",
      });
    }

    if (staffUser.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `Requests can only be assigned to authorized staff/admin members. User '${staffUser.name}' has role '${staffUser.role}'.`,
      });
    }

    // Assign the staff member
    request.assignedTo = staffUser._id;

    // If request is currently in 'Under Review', assigning automatically transitions it to 'Assigned'
    if (request.status === "Under Review") {
      request.status = "Assigned";
    }

    if (typeof adminResponse === "string") {
      request.adminResponse = adminResponse.trim();
    }

    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate("createdBy", "name email department role")
      .populate("assignedTo", "name email department role");

    return res.status(200).json({
      success: true,
      message: `Request successfully assigned to ${staffUser.name}.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated dashboard statistics for admin
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [requestStats] = await ServiceRequest.aggregate([
      {
        $facet: {
          totalRequests: [{ $count: "count" }],
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          priorityCounts: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 },
              },
            },
          ],
          categoryCounts: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
          ],
          highPriorityRequests: [
            {
              $match: {
                priority: { $in: ["High", "Urgent"] },
                status: { $nin: ["Resolved", "Closed", "Rejected"] },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Format status counts as a key-value object
    const statusMap = {
      Pending: 0,
      "Under Review": 0,
      Assigned: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
      Rejected: 0,
    };
    (requestStats.statusCounts || []).forEach((item) => {
      statusMap[item._id] = item.count;
    });

    // Format priority counts
    const priorityMap = {
      Low: 0,
      Medium: 0,
      High: 0,
      Urgent: 0,
    };
    (requestStats.priorityCounts || []).forEach((item) => {
      priorityMap[item._id] = item.count;
    });

    // Format category counts
    const categoryMap = {};
    (requestStats.categoryCounts || []).forEach((item) => {
      categoryMap[item._id] = item.count;
    });

    const totalRequests =
      requestStats.totalRequests && requestStats.totalRequests[0]
        ? requestStats.totalRequests[0].count
        : 0;

    const highPriorityCount =
      requestStats.highPriorityRequests && requestStats.highPriorityRequests[0]
        ? requestStats.highPriorityRequests[0].count
        : 0;

    // Fetch 5 most recent requests
    const recentRequests = await ServiceRequest.find()
      .populate("createdBy", "name email department")
      .populate("assignedTo", "name email department")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        pendingCount: statusMap["Pending"],
        underReviewCount: statusMap["Under Review"],
        assignedCount: statusMap["Assigned"],
        inProgressCount: statusMap["In Progress"],
        resolvedCount: statusMap["Resolved"],
        closedCount: statusMap["Closed"],
        rejectedCount: statusMap["Rejected"],
        highPriorityCount,
        totalStudents,
        totalAdmins,
        byStatus: statusMap,
        byPriority: priorityMap,
        byCategory: categoryMap,
      },
      recentRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered students with search and department filtering
 * @route   GET /api/admin/students
 * @access  Private (Admin)
 */
const getAllStudents = async (req, res, next) => {
  try {
    const query = { role: "student" };

    if (req.query.department && req.query.department !== "All Departments") {
      query.department = req.query.department;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
      ];
    }

    const students = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student profile and their associated service requests
 * @route   GET /api/admin/students/:id
 * @access  Private (Admin)
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid student ID format: '${id}'.`,
      });
    }

    const student = await User.findOne({ _id: id, role: "student" }).select(
      "-password"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    const requests = await ServiceRequest.find({ createdBy: student._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: {
        student,
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRequests,
  updateRequestStatus,
  assignRequest,
  getDashboardStats,
  getAllStudents,
  getStudentById,
};
