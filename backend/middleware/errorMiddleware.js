/**
 * 404 Not Found Middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
  });
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging during development
  if (process.env.NODE_ENV !== "test") {
    console.error("Error:", err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with id of '${err.value}'`;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    const message = `Duplicate value '${value}' entered for unique field '${field}'.`;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // JSON Body Parse Error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};

module.exports = {
  notFound,
  errorHandler,
};
