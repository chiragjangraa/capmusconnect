const mongoose = require("mongoose");

const syllabusModuleSchema = new mongoose.Schema(
  {
    week: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Module title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Completed", "In Progress", "Upcoming"],
      default: "Upcoming",
    },
  },
  { _id: false }
);

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Faculty instructor name is required"],
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      default: "Course Instructor",
    },
    department: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    office: {
      type: String,
      trim: true,
    },
    officeHours: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [150, "Course title cannot exceed 150 characters"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      default: "Core Engineering",
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [10, "Credits cannot exceed 10"],
      default: 3,
    },
    semester: {
      type: String,
      trim: true,
      default: "Semester 5 (Fall 2026)",
    },
    schedule: {
      type: String,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    faculty: {
      type: facultySchema,
      required: [true, "Faculty information is required"],
    },
    syllabus: [syllabusModuleSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance querying
courseSchema.index({ department: 1 });
courseSchema.index({ category: 1 });

module.exports = mongoose.model("Course", courseSchema);
