/**
 * CampusConnect Live Backend Server & API Verification Script
 * - Boots Express server on Port 5000 connected to MongoDB Atlas
 * - Verifies GET /api/health on Port 5000
 * - Tests Admin login using seeded credentials (never printing passwords or tokens)
 * - Tests Student registration and login
 * - Tests all Service Request routes and workflow state machine
 * - Tests Admin dashboard metrics
 * - Verifies Role-based access control and error handling
 * - Cleans up test documents from MongoDB Atlas
 */

const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Configure public DNS fallback
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // continue
}

// Load backend/.env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = require("../server");
const connectDB = require("../config/db");
const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverInstance = null;
let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, testName, details = "") {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    failures.push({ testName, details });
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Reason: ${details}`);
  }
}

async function runVerification() {
  console.log("\n========================================================");
  console.log("   CampusConnect Live Backend Server Verification");
  console.log("========================================================\n");

  try {
    // 1. Connect to MongoDB Atlas
    console.log("Connecting to MongoDB Atlas database...");
    await connectDB();

    // 2. Start Express server on PORT 5000
    await new Promise((resolve, reject) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Express server actively listening on port ${PORT}`);
        resolve();
      });
      serverInstance.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          reject(new Error(`Port ${PORT} is already in use.`));
        } else {
          reject(err);
        }
      });
    });

    // ---------------------------------------------------------
    // TEST 1: Health check & Port Confirmation
    // ---------------------------------------------------------
    console.log("\n[1] Health Check & Port Verification");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200,
      `GET /api/health returned HTTP 200 OK (Port: ${PORT})`
    );
    assert(
      healthData.status === "ok" && healthData.service === "CampusConnect API",
      "API service identifier confirmed: 'CampusConnect API'"
    );

    // ---------------------------------------------------------
    // TEST 2: Admin Login using Seeded Account
    // ---------------------------------------------------------
    console.log("\n[2] Seeded Administrator Authentication");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campusconnect.edu";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD is missing in backend/.env");
    }

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json();

    assert(
      adminLoginRes.status === 200,
      `Admin login succeeded for account: ${adminEmail}`
    );
    assert(
      !!adminLoginData.token && adminLoginData.user?.role === "admin",
      "Admin JWT issued successfully with role: 'admin'"
    );
    const adminToken = adminLoginData.token;
    const adminUserId = adminLoginData.user?._id;

    // ---------------------------------------------------------
    // TEST 3: Student Registration & Login Endpoints
    // ---------------------------------------------------------
    console.log("\n[3] Student Registration & Authentication");
    const testStudentEmail = "live.verifier.student@campusconnect.edu";
    const testStudentPassword = "TestStudentPass2026!";

    // Clean up any previous test student record
    await User.deleteMany({ email: testStudentEmail });

    const studentRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pooja Verma",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "Information Technology",
        role: "admin", // Malicious role escalation test: must be ignored by server
      }),
    });
    const studentRegData = await studentRegRes.json();

    assert(
      studentRegRes.status === 201,
      "POST /api/auth/register returned 201 Created"
    );
    assert(
      studentRegData.user?.role === "student",
      "Registration securely enforced role: 'student' (ignored 'admin' override)"
    );

    // Student Login
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: testStudentPassword,
      }),
    });
    const studentLoginData = await studentLoginRes.json();

    assert(
      studentLoginRes.status === 200,
      "Student login returned 200 OK with valid credentials"
    );
    assert(
      !!studentLoginData.token,
      "Student JWT issued successfully"
    );
    const studentToken = studentLoginData.token;

    // Verify GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.user?.email === testStudentEmail,
      "GET /api/auth/me returned correct authenticated student profile"
    );

    // ---------------------------------------------------------
    // TEST 4: Student Service Request Operations
    // ---------------------------------------------------------
    console.log("\n[4] Student Service Request Operations");
    const createReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Campus Wi-Fi Signal Dropping in Hall 4",
        description: "Frequent disconnection issues encountered during evening hours.",
        category: "IT Support",
        priority: "High",
      }),
    });
    const createReqData = await createReqRes.json();

    assert(
      createReqRes.status === 201,
      "POST /api/requests returned 201 Created"
    );
    assert(
      createReqData.data?.status === "Pending",
      "Newly created request initialized with status: 'Pending'"
    );
    const testRequestId = createReqData.data?._id;

    // Student view own requests
    const getMyReqsRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getMyReqsData = await getMyReqsRes.json();
    assert(
      getMyReqsRes.status === 200 &&
        getMyReqsData.data.some((r) => r._id === testRequestId),
      "GET /api/requests lists student's newly created request"
    );

    // Student update request while Pending
    const updateReqRes = await fetch(
      `${BASE_URL}/api/requests/${testRequestId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: "Campus Wi-Fi Signal Dropping in Hall 4 (Updated)",
        }),
      }
    );
    const updateReqData = await updateReqRes.json();
    assert(
      updateReqRes.status === 200 &&
        updateReqData.data?.title.includes("(Updated)"),
      "PUT /api/requests/:id allows student update while in 'Pending' status"
    );

    // ---------------------------------------------------------
    // TEST 5: Admin Request Management & Status Workflow
    // ---------------------------------------------------------
    console.log("\n[5] Admin Request Management & Status Workflow");
    // Admin list all requests
    const adminReqsRes = await fetch(`${BASE_URL}/api/admin/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminReqsRes.status === 200,
      "GET /api/admin/requests returned 200 OK for admin"
    );

    // Admin transition: Pending -> Under Review
    const toReviewRes = await fetch(
      `${BASE_URL}/api/requests/${testRequestId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "Under Review",
          adminResponse: "Reviewing router logs for Hall 4.",
        }),
      }
    );
    const toReviewData = await toReviewRes.json();
    assert(
      toReviewRes.status === 200 &&
        toReviewData.data?.status === "Under Review",
      "Status transition 'Pending' -> 'Under Review' succeeded"
    );

    // Admin assigns request to staff admin
    const assignRes = await fetch(
      `${BASE_URL}/api/requests/${testRequestId}/assign`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assignedTo: adminUserId,
          adminResponse: "Assigned to Network Operations Team.",
        }),
      }
    );
    const assignData = await assignRes.json();
    assert(
      assignRes.status === 200 &&
        assignData.data?.status === "Assigned" &&
        assignData.data?.assignedTo?._id === adminUserId,
      "Staff assignment succeeded and transitioned status to 'Assigned'"
    );

    // Advance to In Progress -> Resolved -> Closed
    await fetch(`${BASE_URL}/api/requests/${testRequestId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "In Progress" }),
    });

    await fetch(`${BASE_URL}/api/requests/${testRequestId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "Resolved",
        adminResponse: "Access point replaced and coverage confirmed.",
      }),
    });

    const closeRes = await fetch(
      `${BASE_URL}/api/requests/${testRequestId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "Closed" }),
      }
    );
    const closeData = await closeRes.json();
    assert(
      closeRes.status === 200 && closeData.data?.status === "Closed",
      "Full workflow completed: Under Review -> Assigned -> In Progress -> Resolved -> Closed"
    );

    // Invalid transition attempt on Closed status
    const invalidTransRes = await fetch(
      `${BASE_URL}/api/requests/${testRequestId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "Pending" }),
      }
    );
    assert(
      invalidTransRes.status === 400,
      "Invalid transition attempt from terminal status 'Closed' returned 400 Bad Request"
    );

    // ---------------------------------------------------------
    // TEST 6: Admin Dashboard Aggregation Statistics
    // ---------------------------------------------------------
    console.log("\n[6] Admin Dashboard Aggregation Metrics");
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();

    assert(
      dashRes.status === 200,
      "GET /api/admin/dashboard returned 200 OK"
    );
    assert(
      typeof dashData.stats?.totalRequests === "number" &&
        typeof dashData.stats?.totalStudents === "number" &&
        typeof dashData.stats?.totalAdmins === "number",
      `Aggregation pipeline verified (Total Requests: ${dashData.stats?.totalRequests}, Students: ${dashData.stats?.totalStudents}, Admins: ${dashData.stats?.totalAdmins})`
    );

    // ---------------------------------------------------------
    // TEST 7: Security Guards & Error Handling
    // ---------------------------------------------------------
    console.log("\n[7] Role Guards & Error Handling");
    // Student blocked from modifying post-Pending request
    const studentBlockedEdit = await fetch(
      `${BASE_URL}/api/requests/${testRequestId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ title: "Unauthorized Edit Attempt" }),
      }
    );
    assert(
      studentBlockedEdit.status === 400,
      "Student blocked with 400 when attempting to edit post-Pending request"
    );

    // Student blocked from Admin route
    const studentBlockedAdmin = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentBlockedAdmin.status === 403,
      "Student blocked with 403 Forbidden on Admin endpoint"
    );

    // Unauthenticated request
    const unauthReq = await fetch(`${BASE_URL}/api/requests`);
    assert(
      unauthReq.status === 401,
      "Unauthenticated request blocked with 401 Unauthorized"
    );

    // 404 handler
    const notFoundReq = await fetch(`${BASE_URL}/api/non-existent-endpoint`);
    assert(
      notFoundReq.status === 404,
      "Undefined route caught by 404 handler"
    );

    // ---------------------------------------------------------
    // Clean up temporary test data from MongoDB Atlas
    // ---------------------------------------------------------
    console.log("\nCleaning up verification records from MongoDB Atlas...");
    await ServiceRequest.findByIdAndDelete(testRequestId);
    await User.deleteMany({ email: testStudentEmail });
    console.log("Cleanup complete.");

    // Summary
    console.log("\n========================================================");
    console.log(` Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Verification failed with uncaught exception:", error.message);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

runVerification();
