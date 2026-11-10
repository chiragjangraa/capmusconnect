/**
 * CampusConnect Phase 3 Integration Verification
 * Verifies live data integration for Dashboard and Profile endpoints:
 * - Real Student profile retrieval from /api/auth/me
 * - Real Student service requests querying from /api/requests
 * - Student request metric calculation (total, pending, in progress, resolved)
 * - Real Admin profile retrieval and role verification
 * - Real Admin dashboard statistics from /api/admin/dashboard
 * - Verifies student isolation (students only see their own requests)
 * - Cleans up test records from MongoDB Atlas
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

// Load backend .env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = require("../server");
const connectDB = require("../config/db");
const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");

const PORT = 5057; // Dedicated port for Phase 3 verification
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

let serverInstance = null;
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Reason: ${details}`);
  }
}

async function runPhase3Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 3 Dashboard & Profile Verification");
  console.log("========================================================\n");

  const testStudentEmail = "phase3.student.verify@campusconnect.edu";
  const testStudentPassword = "StudentPass2026!";
  let createdRequestIds = [];

  try {
    // 1. Connect DB and boot verification server
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Phase 3 verification server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // Cleanup previous run
    await User.deleteMany({ email: testStudentEmail });

    // ---------------------------------------------------------
    // TEST 1: Register and Authenticate Student
    // ---------------------------------------------------------
    console.log("[1] Student Profile & Identity Verification");
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Devendra Rao",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "Mechanical Engineering",
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, "Student registered successfully");
    const studentToken = regData.token;

    // Verify GET /api/auth/me returns real student data (not Alex Morgan)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();

    assert(
      meRes.status === 200,
      "GET /api/auth/me returns HTTP 200 OK"
    );
    assert(
      meData.user?.name === "Devendra Rao" &&
        meData.user?.department === "Mechanical Engineering" &&
        meData.user?.role === "student",
      "Authenticated user payload matches real student profile (Name: Devendra Rao, Dept: Mechanical Engineering)"
    );

    // ---------------------------------------------------------
    // TEST 2: Student Creates Real Requests & Reads Own Data
    // ---------------------------------------------------------
    console.log("\n[2] Real Student Service Requests & Dashboard Metrics");
    // Create Request 1
    const req1Res = await fetch(`${BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "CAD Lab Workstation Software License Error",
        description: "AutoCAD license expired on terminal ML-08.",
        category: "IT Support",
        priority: "High",
      }),
    });
    const req1Data = await req1Res.json();
    createdRequestIds.push(req1Data.data?._id);

    // Create Request 2
    const req2Res = await fetch(`${BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Workshop Tool Cabinet Lock Replacement",
        description: "Cabinet latch broken in Machine Shop B.",
        category: "Maintenance",
        priority: "Medium",
      }),
    });
    const req2Data = await req2Res.json();
    createdRequestIds.push(req2Data.data?._id);

    // Fetch student's own requests
    const studentReqsRes = await fetch(`${BASE_URL}/requests`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentReqsData = await studentReqsRes.json();

    assert(
      studentReqsRes.status === 200,
      "GET /api/requests returned HTTP 200 OK for student"
    );
    assert(
      studentReqsData.count === 2,
      `Student receives exactly their own 2 requests (Received: ${studentReqsData.count})`
    );

    // Verify calculated metrics match real data
    const totalCount = studentReqsData.data.length;
    const pendingCount = studentReqsData.data.filter(
      (r) => r.status === "Pending" || r.status === "Under Review"
    ).length;

    assert(
      totalCount === 2 && pendingCount === 2,
      "Dashboard request metrics correctly computed from real data (Total: 2, Pending: 2)"
    );

    // ---------------------------------------------------------
    // TEST 3: Admin Profile & Dashboard Aggregation
    // ---------------------------------------------------------
    console.log("\n[3] Admin Profile & Aggregated Dashboard Metrics");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campusconnect.edu";
    const adminPassword = process.env.ADMIN_PASSWORD;

    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, "Admin authenticated successfully");
    const adminToken = adminLoginData.token;

    // Verify Admin Profile
    const adminMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminMeData = await adminMeRes.json();
    assert(
      adminMeData.user?.role === "admin",
      "Admin profile correctly loaded with role 'admin'"
    );

    // Fetch Admin Dashboard Stats
    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDashData = await adminDashRes.json();

    assert(
      adminDashRes.status === 200,
      "GET /api/admin/dashboard returned HTTP 200 OK for administrator"
    );
    assert(
      typeof adminDashData.stats?.totalRequests === "number" &&
        adminDashData.stats?.totalRequests >= 2,
      `Admin dashboard returns real aggregated campus stats (Total Requests: ${adminDashData.stats?.totalRequests})`
    );
    assert(
      Array.isArray(adminDashData.recentRequests) &&
        adminDashData.recentRequests.length > 0,
      "Admin dashboard returns real recent service requests array"
    );

    // ---------------------------------------------------------
    // Clean up
    // ---------------------------------------------------------
    console.log("\nCleaning up test records from MongoDB Atlas...");
    for (const id of createdRequestIds) {
      if (id) await ServiceRequest.findByIdAndDelete(id);
    }
    await User.deleteMany({ email: testStudentEmail });
    console.log("Cleanup complete.");

    // Summary
    console.log("\n========================================================");
    console.log(` Phase 3 Verification: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) process.exit(1);
  } catch (error) {
    console.error("Phase 3 verification failed with error:", error.message);
    process.exit(1);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  }
}

runPhase3Tests();
