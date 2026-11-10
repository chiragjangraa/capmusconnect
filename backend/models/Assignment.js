const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      trim: true,
    },
    studentEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    fileName: {
      type: String,
      required: [true, "Submission deliverable file name is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Submitted", "Completed"],
      default: "Submitted",
    },
    score: {
      type: String,
      trim: true,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    instructor: {
      type: String,
      required: [true, "Instructor name is required"],
      trim: true,
    },
    dueDate: {
      type: String,
      required: [true, "Due date is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    points: {
      type: String,
      required: [true, "Points value is required"],
      trim: true,
      default: "100 pts",
    },
    type: {
      type: String,
      trim: true,
      default: "Assignment",
    },
    description: {
      type: String,
      required: [true, "Assignment description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    submissions: [submissionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ courseCode: 1 });
assignmentSchema.index({ "submissions.student": 1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
