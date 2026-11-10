const mongoose = require("mongoose");
const ServiceRequest = require("../models/ServiceRequest");
const { escapeRegex } = require("../utils/regexHelper");

/**
 * @desc    Create a new service request
 * @route   POST /api/requests
 * @access  Private (Student)
 */
const createRequest = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, description, and category.",
      });
    }

    const request = await ServiceRequest.create({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || "Medium",
      status: "Pending",
      createdBy: req.user._id,
    });

    const populatedRequest = await ServiceRequest.findById(request._id).populate(
      "createdBy",
      "name email department"
    );

    return res.status(201).json({
      success: true,
      message: "Service request created successfully.",
      data: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get service requests (Students see only their own; Admins see all with filters)
 * @route   GET /api/requests
 * @access  Private
 */
const getRequests = async (req, res, next) => {
  try {
    const query = {};

    // Role-based scoping: Students can only view their own requests
    if (req.user.role === "student") {
      query.createdBy = req.user._id;
    }

    // Filters for status, priority, category
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    // Text search in title or description
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
 * @desc    Get single request by ID
 * @route   GET /api/requests/:id
 * @access  Private
 */
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request ID format: '${id}'.`,
      });
    }

    const request = await ServiceRequest.findById(id)
      .populate("createdBy", "name email department role")
      .populate("assignedTo", "name email department role");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    // Authorization check: Students can only view their own requests
    if (
      req.user.role === "student" &&
      request.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view this request.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update service request (Students only, and ONLY while Pending)
 * @route   PUT /api/requests/:id
 * @access  Private (Owner Student)
 */
const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request ID format: '${id}'.`,
      });
    }

    const request = await ServiceRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    // Check ownership
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own service requests.",
      });
    }

    // Enforcement: Requests can only be updated while in 'Pending' status
    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Request cannot be edited once it has moved past 'Pending'. Current status: '${request.status}'.`,
      });
    }

    const { title, description, category, priority } = req.body;

    if (title) request.title = title.trim();
    if (description) request.description = description.trim();
    if (category) request.category = category;
    if (priority) request.priority = priority;

    const updatedRequest = await request.save();
    const populated = await ServiceRequest.findById(updatedRequest._id).populate(
      "createdBy",
      "name email department"
    );

    return res.status(200).json({
      success: true,
      message: "Service request updated successfully.",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete service request (Students only, and ONLY while Pending)
 * @route   DELETE /api/requests/:id
 * @access  Private (Owner Student)
 */
const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid request ID format: '${id}'.`,
      });
    }

    const request = await ServiceRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    // Check ownership
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only delete your own service requests.",
      });
    }

    // Enforcement: Requests can only be deleted while in 'Pending' status
    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Request cannot be deleted once it has moved past 'Pending'. Current status: '${request.status}'.`,
      });
    }

    await ServiceRequest.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Service request deleted successfully.",
      requestId: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
};
