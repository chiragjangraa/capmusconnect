const mongoose = require("mongoose");
const Course = require("../models/Course");
const { escapeRegex } = require("../utils/regexHelper");

/**
 * @desc    Get all courses with search and filtering
 * @route   GET /api/courses
 * @access  Private (Authenticated users: Student & Admin)
 */
const getAllCourses = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.category && req.query.category !== "All Categories") {
      query.category = req.query.category;
    }

    if (req.query.department && req.query.department !== "All Departments") {
      query.department = req.query.department;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [
        { code: searchRegex },
        { title: searchRegex },
        { department: searchRegex },
        { "faculty.name": searchRegex },
        { description: searchRegex },
      ];
    }

    let sortOptions = { code: 1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case "credits-desc":
          sortOptions = { credits: -1 };
          break;
        case "credits-asc":
          sortOptions = { credits: 1 };
          break;
        case "title":
          sortOptions = { title: 1 };
          break;
        case "newest":
          sortOptions = { createdAt: -1 };
          break;
        default:
          sortOptions = { code: 1 };
      }
    }

    const courses = await Course.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single course by MongoDB _id or course code
 * @route   GET /api/courses/:id
 * @access  Private (Authenticated users: Student & Admin)
 */
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let course = null;

    // First check if id is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    }

    // If not found by ObjectId, lookup by course code (case-insensitive)
    if (!course) {
      course = await Course.findOne({
        code: new RegExp(`^${escapeRegex(id.trim())}$`, "i"),
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with identifier '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course (Admin only)
 * @route   POST /api/courses
 * @access  Private (Admin)
 */
const createCourse = async (req, res, next) => {
  try {
    const {
      code,
      title,
      department,
      category,
      credits,
      semester,
      schedule,
      room,
      description,
      progress,
      faculty,
      syllabus,
    } = req.body;

    if (!code || !title || !department || !description) {
      return res.status(400).json({
        success: false,
        message: "Course code, title, department, and description are required.",
      });
    }

    const existingCourse = await Course.findOne({
      code: new RegExp(`^${code.trim()}$`, "i"),
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: `Course with code '${code.trim().toUpperCase()}' already exists.`,
      });
    }

    const course = await Course.create({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      department: department.trim(),
      category: category ? category.trim() : "Core Engineering",
      credits: credits ? Number(credits) : 3,
      semester: semester ? semester.trim() : "Semester 5 (Fall 2026)",
      schedule: schedule ? schedule.trim() : undefined,
      room: room ? room.trim() : undefined,
      description: description.trim(),
      progress: progress !== undefined ? Number(progress) : 0,
      faculty: faculty || {
        name: "Department Faculty",
        role: "Instructor",
        department: department.trim(),
      },
      syllabus: syllabus || [],
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a course (Admin only)
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    let course = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    }
    if (!course) {
      course = await Course.findOne({
        code: new RegExp(`^${id.trim()}$`, "i"),
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with identifier '${id}' was not found.`,
      });
    }

    const updated = await Course.findByIdAndUpdate(course._id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a course (Admin only)
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    let course = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    }
    if (!course) {
      course = await Course.findOne({
        code: new RegExp(`^${id.trim()}$`, "i"),
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with identifier '${id}' was not found.`,
      });
    }

    await Course.findByIdAndDelete(course._id);

    return res.status(200).json({
      success: true,
      message: `Course '${course.code}' removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
