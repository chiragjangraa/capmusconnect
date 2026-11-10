const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const { escapeRegex } = require("../utils/regexHelper");

function formatSubmittedDate(date) {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * @desc    Get all coursework assignments with student-specific submission status
 * @route   GET /api/assignments
 * @access  Private (Authenticated users: Student & Admin)
 */
const getAllAssignments = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.courseCode) {
      query.courseCode = req.query.courseCode.trim().toUpperCase();
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [
        { title: searchRegex },
        { courseCode: searchRegex },
        { courseName: searchRegex },
        { instructor: searchRegex },
        { description: searchRegex },
      ];
    }

    const assignments = await Assignment.find(query).sort({ createdAt: -1 });

    const userIdStr = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // Map each assignment to include user's personal submission details
    let mappedAssignments = assignments.map((asgn) => {
      const asgnObj = asgn.toObject();

      const userSub = asgn.submissions.find(
        (s) => s.student && s.student.toString() === userIdStr
      );

      if (userSub) {
        asgnObj.status = userSub.status || "Submitted";
        asgnObj.submittedDate = formatSubmittedDate(userSub.submittedAt);
        asgnObj.submissionFile = userSub.fileName;
        asgnObj.submissionNotes = userSub.notes;
        asgnObj.score = userSub.score || null;
        asgnObj.feedback = userSub.feedback || null;
      } else {
        asgnObj.status = "Pending";
        asgnObj.submittedDate = null;
        asgnObj.submissionFile = null;
        asgnObj.submissionNotes = null;
        asgnObj.score = null;
        asgnObj.feedback = null;
      }

      asgnObj.id = asgnObj._id.toString();
      if (!isAdmin) {
        delete asgnObj.submissions;
      } else {
        asgnObj.totalSubmissions = asgn.submissions.length;
      }

      return asgnObj;
    });

    // Apply status filter if provided (and not "All")
    if (req.query.status && req.query.status !== "All") {
      mappedAssignments = mappedAssignments.filter(
        (a) => a.status.toLowerCase() === req.query.status.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: mappedAssignments.length,
      data: mappedAssignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single assignment by ID
 * @route   GET /api/assignments/:id
 * @access  Private (Authenticated users: Student & Admin)
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment ID format: '${id}'.`,
      });
    }

    const asgn = await Assignment.findById(id);
    if (!asgn) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    const userIdStr = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const asgnObj = asgn.toObject();

    const userSub = asgn.submissions.find(
      (s) => s.student && s.student.toString() === userIdStr
    );

    if (userSub) {
      asgnObj.status = userSub.status || "Submitted";
      asgnObj.submittedDate = formatSubmittedDate(userSub.submittedAt);
      asgnObj.submissionFile = userSub.fileName;
      asgnObj.submissionNotes = userSub.notes;
      asgnObj.score = userSub.score || null;
      asgnObj.feedback = userSub.feedback || null;
    } else {
      asgnObj.status = "Pending";
      asgnObj.submittedDate = null;
      asgnObj.submissionFile = null;
      asgnObj.submissionNotes = null;
      asgnObj.score = null;
      asgnObj.feedback = null;
    }

    asgnObj.id = asgnObj._id.toString();
    if (!isAdmin) {
      delete asgnObj.submissions;
    }

    return res.status(200).json({
      success: true,
      data: asgnObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit an assignment deliverable (Student or Admin)
 * @route   POST /api/assignments/:id/submit
 * @access  Private
 */
const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fileName, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment ID format: '${id}'.`,
      });
    }

    if (!fileName || !fileName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Deliverable file name is required for assignment submission.",
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    const userIdStr = req.user._id.toString();
    const existingSubIndex = assignment.submissions.findIndex(
      (s) => s.student && s.student.toString() === userIdStr
    );

    let submissionRecord = null;

    if (existingSubIndex >= 0) {
      // Update existing submission
      assignment.submissions[existingSubIndex].fileName = fileName.trim();
      assignment.submissions[existingSubIndex].notes = notes
        ? notes.trim()
        : assignment.submissions[existingSubIndex].notes;
      assignment.submissions[existingSubIndex].submittedAt = new Date();
      assignment.submissions[existingSubIndex].status = "Submitted";
      submissionRecord = assignment.submissions[existingSubIndex];
    } else {
      // Create new submission
      const newSub = {
        student: req.user._id,
        studentName: req.user.name,
        studentEmail: req.user.email,
        fileName: fileName.trim(),
        notes: notes ? notes.trim() : "",
        submittedAt: new Date(),
        status: "Submitted",
      };
      assignment.submissions.push(newSub);
      submissionRecord = newSub;
    }

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: `Assignment "${assignment.title}" submitted successfully.`,
      data: {
        assignmentId: assignment._id,
        status: "Submitted",
        fileName: submissionRecord.fileName,
        submittedAt: submissionRecord.submittedAt,
        notes: submissionRecord.notes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new assignment (Admin only)
 * @route   POST /api/assignments
 * @access  Private (Admin)
 */
const createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      courseCode,
      courseName,
      instructor,
      dueDate,
      priority,
      points,
      type,
      description,
    } = req.body;

    if (!title || !courseCode || !courseName || !instructor || !dueDate || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, courseCode, courseName, instructor, dueDate, and description are required.",
      });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      instructor: instructor.trim(),
      dueDate: dueDate.trim(),
      priority: priority || "medium",
      points: points ? points.trim() : "100 pts",
      type: type ? type.trim() : "Assignment",
      description: description.trim(),
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update assignment details (Admin only)
 * @route   PUT /api/assignments/:id
 * @access  Private (Admin)
 */
const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment ID format: '${id}'.`,
      });
    }

    const updated = await Assignment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grade a student's submission (Admin only)
 * @route   PUT /api/assignments/:id/grade
 * @access  Private (Admin)
 */
const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentId, score, feedback, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid assignment ID and student ID are required.",
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    const sub = assignment.submissions.find(
      (s) => s.student && s.student.toString() === studentId.toString()
    );

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Student submission not found for this assignment.",
      });
    }

    if (score !== undefined) sub.score = score;
    if (feedback !== undefined) sub.feedback = feedback;
    sub.status = status || "Completed";

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Submission evaluated successfully.",
      data: sub,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete assignment (Admin only)
 * @route   DELETE /api/assignments/:id
 * @access  Private (Admin)
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid assignment ID format: '${id}'.`,
      });
    }

    const deleted = await Assignment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  submitAssignment,
  createAssignment,
  updateAssignment,
  gradeSubmission,
  deleteAssignment,
};
