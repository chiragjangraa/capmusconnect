const path = require("path");
const dns = require("dns");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Configure public DNS fallback for Windows Node.js querySrv resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // continue with default
}

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Secure Proxy Configuration:
// Do not blindly trust forwarded headers unless explicitly configured for the deployment environment
if (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
} else if (process.env.TRUST_PROXY) {
  app.set("trust proxy", process.env.TRUST_PROXY);
} else {
  app.set("trust proxy", false);
}

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === "production") {
        return callback(
          new Error(`CORS Error: Origin '${origin}' is not permitted by CORS policy.`),
          false
        );
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CampusConnect API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server if executed directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` CampusConnect Backend Server Running!`);
      console.log(` Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(` Server URL  : http://localhost:${PORT}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  });
}

module.exports = app;
