const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Academic",
          "Hostel",
          "IT Support",
          "Library",
          "Administrative",
          "Maintenance",
          "Other",
        ],
        message: "{VALUE} is not a valid category",
      },
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: {
        values: ["Low", "Medium", "High", "Urgent"],
        message: "{VALUE} is not a valid priority",
      },
      default: "Medium",
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "Pending",
          "Under Review",
          "Assigned",
          "In Progress",
          "Resolved",
          "Closed",
          "Rejected",
        ],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy user reference is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminResponse: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-performance querying and aggregation
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ priority: 1 });
serviceRequestSchema.index({ category: 1 });
serviceRequestSchema.index({ createdBy: 1 });
serviceRequestSchema.index({ assignedTo: 1 });

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
