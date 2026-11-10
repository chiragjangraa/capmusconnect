/**
 * CampusConnect Backend Verification & Integration Test Suite
 * Tests all required assessment functionalities:
 * - Authentication (Student registration & login, Admin login)
 * - Security (Role enforcement, password hashing, JWT protection)
 * - Service Requests (CRUD with status restriction to Pending)
 * - Request Assignment (Validates staff/admin role, rejects student assignment)
 * - State Machine Workflow (Pending -> Under Review -> Assigned -> In Progress -> Resolved -> Closed, and Rejected)
 * - Dashboard Aggregation ($facet MongoDB pipeline)
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load backend .env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = require("../server");
const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const MONGODB_PATH = "C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe";
const SCRATCH_DB =
  "C:\\Users\\chira\\.gemini\\antigravity\\brain\\0bf6eb8a-9649-4205-aa48-7cee6270a59d\\scratch\\mongodb_data";

let mongodProcess = null;
let serverInstance = null;

let studentToken = "";
let studentUser = null;
let adminToken = "";
let adminUser = null;

// Assertion helper
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

const net = require("net");

function isPortListening(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ port, host: "127.0.0.1" }, () => {
      client.end();
      resolve(true);
    });
    client.on("error", () => {
      client.destroy();
      resolve(false);
    });
    client.setTimeout(1000, () => {
      client.destroy();
      resolve(false);
    });
  });
}

// Start MongoDB process if not already running
async function ensureMongoDB() {
  const isRunning = await isPortListening(27017);
  if (isRunning) {
    console.log("MongoDB is already running on port 27017.");
    return;
  }

  console.log("No running MongoDB found on port 27017. Spawning local instance...");
  if (!fs.existsSync(SCRATCH_DB)) {
    fs.mkdirSync(SCRATCH_DB, { recursive: true });
  }

  // Remove stale lock files if any
  try {
    const lockFiles = ["mongod.lock", "WiredTiger.lock"];
    for (const file of lockFiles) {
      const fullPath = path.join(SCRATCH_DB, file);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  } catch (e) {
    // ignore
  }

  return new Promise((resolve, reject) => {
    mongodProcess = spawn(
      MONGODB_PATH,
      ["--dbpath", SCRATCH_DB, "--port", "27017", "--bind_ip", "127.0.0.1"],
      {
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let isResolved = false;

    mongodProcess.stdout.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Waiting for connections") && !isResolved) {
        isResolved = true;
        console.log("MongoDB is ready and listening for connections.");
        mongodProcess.stdout.resume();
        mongodProcess.stderr.resume();
        resolve();
      }
    });

    mongodProcess.stderr.on("data", (data) => {
      console.error("mongod stderr:", data.toString());
    });

    mongodProcess.on("error", (err) => {
      if (!isResolved) {
        isResolved = true;
        reject(err);
      }
    });

    mongodProcess.on("exit", (code) => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`mongod exited prematurely with code ${code}`));
      }
    });

    // 15 second timeout fallback
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error("Timeout waiting for MongoDB 'Waiting for connections' signal."));
      }
    }, 15000);
  });
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Backend Full Verification Suite");
  console.log("========================================================\n");

  try {
    await ensureMongoDB();

    // Connect Mongoose
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusconnect";
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    console.log("Connected to MongoDB database.");

    // Clean test database collection for reproducible test run
    await User.deleteMany({ email: { $regex: /@test\.edu|@campusconnect\.edu/ } });
    await ServiceRequest.deleteMany({});

    // Start Express server
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, "127.0.0.1", () => {
        console.log(`Express test server listening on ${BASE_URL}\n`);
        resolve();
      });
    });

    // ---------------------------------------------------------
    // TEST SUITE 1: System Health Check
    // ---------------------------------------------------------
    console.log("[1] System & API Health Check");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.status === "ok",
      "GET /api/health returns 200 and status: ok"
    );

    // ---------------------------------------------------------
    // TEST SUITE 2: Student Registration & Security
    // ---------------------------------------------------------
    console.log("\n[2] Authentication & Security: Student Registration");
    const studentPayload = {
      name: "Rohan Sharma",
      email: "rohan@test.edu",
      password: "Password123!",
      department: "Computer Science",
      // Attempting to send role: 'admin' to test privilege escalation prevention
      role: "admin",
    };

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentPayload),
    });
    const regData = await regRes.json();

    assert(regRes.status === 201, "POST /api/auth/register returns 201 Created");
    assert(
      regData.success === true && !!regData.token,
      "Response contains success: true and JWT token"
    );
    assert(
      regData.user.role === "student",
      "Security: Public registration strictly assigns role 'student' (ignored malicious 'admin' input)"
    );
    studentToken = regData.token;
    studentUser = regData.user;

    // Test duplicate registration prevention
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentPayload),
    });
    assert(
      dupRes.status === 400,
      "Duplicate email registration is rejected with 400 Bad Request"
    );

    // ---------------------------------------------------------
    // TEST SUITE 3: Student Login & Profile
    // ---------------------------------------------------------
    console.log("\n[3] Authentication: Student Login & JWT Verification");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rohan@test.edu",
        password: "Password123!",
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, "POST /api/auth/login returns 200 OK");
    assert(!!loginData.token, "Login returns valid JWT token");

    // Invalid password test
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rohan@test.edu",
        password: "WrongPassword!",
      }),
    });
    assert(
      badLoginRes.status === 401,
      "Login with incorrect password returns 401 Unauthorized"
    );

    // Access protected route /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.user.email === "rohan@test.edu",
      "GET /api/auth/me returns authenticated student profile"
    );

    // ---------------------------------------------------------
    // TEST SUITE 4: Admin Seeding & Admin Login
    // ---------------------------------------------------------
    console.log("\n[4] Admin Authentication & Seeding");
    // Seed admin using Model
    adminUser = await User.create({
      name: "Dr. Arvind Mehta",
      email: "admin@campusconnect.edu",
      password: "AdminPass2026!",
      role: "admin",
      department: "Dean Office",
    });

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@campusconnect.edu",
        password: "AdminPass2026!",
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, "Admin login succeeds with 200 OK");
    assert(
      adminLoginData.user.role === "admin",
      "Admin user has verified role: 'admin'"
    );
    adminToken = adminLoginData.token;

    // ---------------------------------------------------------
    // TEST SUITE 5: Role-Based Authorization Enforcement
    // ---------------------------------------------------------
    console.log("\n[5] Role-Based Authorization Guards");
    // Student attempting to access admin route
    const forbiddenRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      forbiddenRes.status === 403,
      "Student accessing GET /api/admin/dashboard receives 403 Forbidden"
    );

    // Unauthenticated request without token
    const unauthRes = await fetch(`${BASE_URL}/api/requests`);
    assert(
      unauthRes.status === 401,
      "Unauthenticated request receives 401 Unauthorized"
    );

    // ---------------------------------------------------------
    // TEST SUITE 6: Student Service Request CRUD
    // ---------------------------------------------------------
    console.log("\n[6] Student Service Request Operations");
    // Create Request 1
    const req1Res = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Hostel Wi-Fi not working in Block B",
        description: "The 5GHz router on 3rd floor has no internet connectivity.",
        category: "IT Support",
        priority: "High",
      }),
    });
    const req1Data = await req1Res.json();
    assert(req1Res.status === 201, "Student creates request with 201 Created");
    assert(
      req1Data.data.status === "Pending",
      "New service request status defaults strictly to 'Pending'"
    );
    const requestId1 = req1Data.data._id;

    // Create Request 2
    const req2Res = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Library access card defective",
        description: "Barcode cannot be scanned at RFID turnstile.",
        category: "Library",
        priority: "Medium",
      }),
    });
    const req2Data = await req2Res.json();
    const requestId2 = req2Data.data._id;

    // Student views own requests
    const myReqsRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const myReqsData = await myReqsRes.json();
    assert(
      myReqsRes.status === 200 && myReqsData.count === 2,
      "Student views only their own 2 requests"
    );

    // Student updates Request 2 while Pending
    const updateRes = await fetch(`${BASE_URL}/api/requests/${requestId2}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Library access card barcode worn out",
        description: "Turnstile scanner shows invalid card ID.",
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
        updateData.data.title === "Library access card barcode worn out",
      "Student can successfully update request while in 'Pending' status"
    );

    // Student creates Request 3 and deletes it while Pending
    const req3Res = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Temporary test request to delete",
        description: "This request will be deleted while in Pending status.",
        category: "Other",
        priority: "Low",
      }),
    });
    const req3Data = await req3Res.json();
    const requestId3 = req3Data.data._id;

    const delRes = await fetch(`${BASE_URL}/api/requests/${requestId3}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      delRes.status === 200,
      "Student can successfully delete request while in 'Pending' status"
    );

    // ---------------------------------------------------------
    // TEST SUITE 7: Status Workflow & State Machine Enforcement
    // ---------------------------------------------------------
    console.log("\n[7] Exact Status Workflow State Machine Enforcement");
    console.log(
      "    Rule: Pending -> Under Review -> Assigned -> In Progress -> Resolved -> Closed"
    );

    // Attempt INVALID transition: Pending -> Resolved
    const invalidTrans1 = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "Resolved" }),
      }
    );
    assert(
      invalidTrans1.status === 400,
      "Invalid transition 'Pending' -> 'Resolved' is rejected with 400 Bad Request"
    );

    // Attempt INVALID transition: Pending -> In Progress
    const invalidTrans2 = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "In Progress" }),
      }
    );
    assert(
      invalidTrans2.status === 400,
      "Invalid transition 'Pending' -> 'In Progress' is rejected with 400 Bad Request"
    );

    // VALID transition: Pending -> Under Review
    const validTrans1 = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "Under Review",
          adminResponse: "Request acknowledged by IT Admin desk.",
        }),
      }
    );
    const validData1 = await validTrans1.json();
    assert(
      validTrans1.status === 200 && validData1.data.status === "Under Review",
      "Valid transition 'Pending' -> 'Under Review' succeeds with 200 OK"
    );

    // ---------------------------------------------------------
    // TEST SUITE 8: Assignment Validation (Staff/Admin vs Student)
    // ---------------------------------------------------------
    console.log("\n[8] Assignment Validation Security Rule");
    // Attempt assigning to student user (MUST FAIL)
    const badAssignRes = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/assign`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ assignedTo: studentUser._id }),
      }
    );
    assert(
      badAssignRes.status === 400,
      "Security: Assigning request to a student is rejected with 400 Bad Request"
    );

    // Assigning to valid Admin/Staff user (MUST SUCCEED)
    const goodAssignRes = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/assign`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assignedTo: adminUser._id,
          adminResponse: "Assigned to Senior Network Engineer.",
        }),
      }
    );
    const goodAssignData = await goodAssignRes.json();
    assert(
      goodAssignRes.status === 200 &&
        goodAssignData.data.assignedTo._id.toString() ===
          adminUser._id.toString() &&
        goodAssignData.data.status === "Assigned",
      "Assigning to staff member succeeds and transitions status from 'Under Review' to 'Assigned'"
    );

    // ---------------------------------------------------------
    // TEST SUITE 9: Student Cannot Modify Post-Pending Requests
    // ---------------------------------------------------------
    console.log("\n[9] Student Edit/Delete Lock Post-Pending");
    const editBlockedRes = await fetch(
      `${BASE_URL}/api/requests/${requestId1}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ title: "Student trying to edit after assignment" }),
      }
    );
    assert(
      editBlockedRes.status === 400,
      "Student cannot update request once status is no longer 'Pending'"
    );

    const deleteBlockedRes = await fetch(
      `${BASE_URL}/api/requests/${requestId1}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    assert(
      deleteBlockedRes.status === 400,
      "Student cannot delete request once status is no longer 'Pending'"
    );

    // ---------------------------------------------------------
    // TEST SUITE 10: Complete Remaining Workflow Progression
    // ---------------------------------------------------------
    console.log("\n[10] Progression to In Progress -> Resolved -> Closed");
    // Assigned -> In Progress
    const transToInProgress = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "In Progress" }),
      }
    );
    assert(
      transToInProgress.status === 200,
      "Valid transition 'Assigned' -> 'In Progress' succeeds"
    );

    // In Progress -> Resolved
    const transToResolved = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "Resolved",
          adminResponse: "Hardware router replaced and network speed verified at 100 Mbps.",
        }),
      }
    );
    const resolvedData = await transToResolved.json();
    assert(
      transToResolved.status === 200 &&
        resolvedData.data.adminResponse.includes("Hardware router replaced"),
      "Valid transition 'In Progress' -> 'Resolved' with adminResponse succeeds"
    );

    // Resolved -> Closed
    const transToClosed = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "Closed" }),
      }
    );
    assert(
      transToClosed.status === 200,
      "Valid transition 'Resolved' -> 'Closed' succeeds"
    );

    // Terminal stage: Closed -> anything else MUST FAIL
    const transFromClosed = await fetch(
      `${BASE_URL}/api/requests/${requestId1}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "In Progress" }),
      }
    );
    assert(
      transFromClosed.status === 400,
      "Terminal stage 'Closed' rejects any further transitions"
    );

    // ---------------------------------------------------------
    // TEST SUITE 11: Rejection Workflow
    // ---------------------------------------------------------
    console.log("\n[11] Rejection Workflow Verification");
    // Create new request to test Pending -> Rejected
    const rejectReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Invalid request to test rejection",
        description: "Testing rejection from Pending stage.",
        category: "Other",
        priority: "Low",
      }),
    });
    const rejectReqData = await rejectReqRes.json();
    const rejectReqId = rejectReqData.data._id;

    const rejectTrans = await fetch(
      `${BASE_URL}/api/requests/${rejectReqId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "Rejected",
          adminResponse: "Request does not meet campus support criteria.",
        }),
      }
    );
    assert(
      rejectTrans.status === 200,
      "Valid transition 'Pending' -> 'Rejected' succeeds"
    );

    // Rejected is terminal: attempt transition from Rejected
    const transFromRejected = await fetch(
      `${BASE_URL}/api/requests/${rejectReqId}/status`,
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
      transFromRejected.status === 400,
      "Terminal stage 'Rejected' rejects any further transitions"
    );

    // ---------------------------------------------------------
    // TEST SUITE 12: Admin Dashboard Aggregation Statistics
    // ---------------------------------------------------------
    console.log("\n[12] Admin Dashboard Aggregation Pipeline ($facet)");
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();

    assert(dashRes.status === 200, "GET /api/admin/dashboard returns 200 OK");
    assert(
      dashData.stats.totalRequests >= 2,
      `Calculates totalRequests correctly (Count: ${dashData.stats.totalRequests})`
    );
    assert(
      typeof dashData.stats.closedCount === "number" &&
        dashData.stats.closedCount >= 1,
      `Calculates closedCount accurately (Count: ${dashData.stats.closedCount})`
    );
    assert(
      typeof dashData.stats.rejectedCount === "number" &&
        dashData.stats.rejectedCount >= 1,
      `Calculates rejectedCount accurately (Count: ${dashData.stats.rejectedCount})`
    );
    assert(
      dashData.stats.totalStudents >= 1 && dashData.stats.totalAdmins >= 1,
      `Accurately counts registered students (${dashData.stats.totalStudents}) and admins (${dashData.stats.totalAdmins})`
    );
    assert(
      dashData.stats.byCategory && dashData.stats.byPriority,
      "Provides breakdowns by category and by priority"
    );
    assert(
      Array.isArray(dashData.recentRequests) &&
        dashData.recentRequests.length > 0,
      "Returns list of recent service requests"
    );

    // ---------------------------------------------------------
    // TEST SUITE 13: Admin Filtering & Search
    // ---------------------------------------------------------
    console.log("\n[13] Admin Request Filtering & Search");
    const filterRes = await fetch(
      `${BASE_URL}/api/admin/requests?category=Library`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const filterData = await filterRes.json();
    assert(
      filterRes.status === 200 &&
        filterData.data.every((r) => r.category === "Library"),
      "Filtering requests by category=Library returns only Library requests"
    );

    const searchRes = await fetch(
      `${BASE_URL}/api/admin/requests?search=barcode`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 && searchData.count >= 1,
      "Search keyword 'barcode' correctly matches title/description"
    );

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------
    console.log("\n========================================================");
    console.log(` Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  } finally {
    // Cleanup
    if (serverInstance) {
      serverInstance.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongodProcess) {
      console.log("Stopping local MongoDB instance...");
      mongodProcess.kill();
    }
  }
}

runTests();
