/**
 * CampusConnect Phase 4 Integration Verification
 * Verifies live database integration for Student Management & Directory:
 * - Admin student listing from GET /api/admin/students
 * - Search query filtering (by name, email, department)
 * - Department query filtering
 * - Single student detail + service requests retrieval from GET /api/admin/students/:id
 * - Validates password exclusion in responses
 * - Validates input handling (invalid ObjectId -> 400, non-existent -> 404)
 * - Strict Role-Based Security: Students blocked with 403 Forbidden
 * - Unauthenticated requests blocked with 401 Unauthorized
 * - Full cleanup of temporary test data from MongoDB Atlas
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

const PORT = 5058; // Dedicated port for Phase 4 verification
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

async function runPhase4Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 4 Student Directory Verification");
  console.log("========================================================\n");

  const testStudent1Email = "phase4.student1.verify@campusconnect.edu";
  const testStudent2Email = "phase4.student2.verify@campusconnect.edu";
  const testStudentPassword = "StudentPass2026!";
  let student1Id = null;
  let student2Id = null;
  let createdRequestId = null;

  try {
    // 1. Connect DB and boot verification server
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Phase 4 verification server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // Clean up previous runs if any
    await User.deleteMany({
      email: { $in: [testStudent1Email, testStudent2Email] },
    });

    // ---------------------------------------------------------
    // TEST 1: Authenticate Admin
    // ---------------------------------------------------------
    console.log("[1] Admin Authentication");
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.INITIAL_ADMIN_EMAIL ||
      "admin@campusconnect.edu";
    const adminPassword =
      process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;

    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();

    assert(
      adminLoginRes.status === 200 && adminLoginData.token,
      "Admin logs in successfully and receives JWT token"
    );
    assert(
      adminLoginData.user?.role === "admin",
      "Authenticated user has 'admin' role"
    );
    const adminToken = adminLoginData.token;

    // ---------------------------------------------------------
    // TEST 2: Register Test Students & Create Service Request
    // ---------------------------------------------------------
    console.log("\n[2] Seed Test Students & Request");
    const regRes1 = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "PhaseFour Student Alpha",
        email: testStudent1Email,
        password: testStudentPassword,
        department: "Computer Science",
      }),
    });
    const regData1 = await regRes1.json();
    student1Id = regData1.user?._id;
    const student1Token = regData1.token;

    assert(
      regRes1.status === 201 && student1Id,
      "Test Student Alpha registered with Department 'Computer Science'"
    );

    const regRes2 = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "PhaseFour Student Beta",
        email: testStudent2Email,
        password: testStudentPassword,
        department: "Electrical Engineering",
      }),
    });
    const regData2 = await regRes2.json();
    student2Id = regData2.user?._id;

    assert(
      regRes2.status === 201 && student2Id,
      "Test Student Beta registered with Department 'Electrical Engineering'"
    );

    // Create a service request for Student 1
    const reqRes = await fetch(`${BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        title: "Lab Workstation GPU Driver Failure",
        description: "CUDA drivers missing on node 4 in CS Lab 2.",
        category: "IT Support",
        priority: "High",
      }),
    });
    const reqData = await reqRes.json();
    createdRequestId = reqData.data?._id;

    assert(
      reqRes.status === 201 && createdRequestId,
      "Created test service request for Student Alpha"
    );

    // ---------------------------------------------------------
    // TEST 3: Admin Student Listing (GET /api/admin/students)
    // ---------------------------------------------------------
    console.log("\n[3] Admin Student Listing (GET /api/admin/students)");
    const listRes = await fetch(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();

    assert(
      listRes.status === 200 && listData.success === true,
      "GET /api/admin/students returns 200 OK with success flag"
    );
    assert(
      Array.isArray(listData.data) && listData.data.length >= 2,
      `Students array returned with count: ${listData.count || listData.data?.length}`
    );

    const foundAlpha = listData.data.find((s) => s.email === testStudent1Email);
    assert(
      foundAlpha && foundAlpha.role === "student" && !foundAlpha.password,
      "Student Alpha found in list with role 'student' and password omitted"
    );

    // ---------------------------------------------------------
    // TEST 4: Student Search and Department Filtering
    // ---------------------------------------------------------
    console.log("\n[4] Search and Department Filtering");

    // Search by name
    const searchRes = await fetch(
      `${BASE_URL}/admin/students?search=Student%20Alpha`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
        searchData.data.some((s) => s.email === testStudent1Email) &&
        !searchData.data.some((s) => s.email === testStudent2Email),
      "Search by 'Student Alpha' returns only Student Alpha"
    );

    // Filter by department
    const deptRes = await fetch(
      `${BASE_URL}/admin/students?department=Electrical%20Engineering`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const deptData = await deptRes.json();
    assert(
      deptRes.status === 200 &&
        deptData.data.some((s) => s.email === testStudent2Email) &&
        !deptData.data.some((s) => s.email === testStudent1Email),
      "Filter by 'Electrical Engineering' returns only Student Beta"
    );

    // ---------------------------------------------------------
    // TEST 5: Single Student Details & Service Requests (GET /api/admin/students/:id)
    // ---------------------------------------------------------
    console.log("\n[5] Single Student Detail (GET /api/admin/students/:id)");
    const detailRes = await fetch(`${BASE_URL}/admin/students/${student1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();

    assert(
      detailRes.status === 200 && detailData.success === true,
      "GET /api/admin/students/:id returns 200 OK"
    );
    assert(
      detailData.data?.student?._id === student1Id &&
        detailData.data.student.email === testStudent1Email,
      "Returned student profile matches Student Alpha"
    );
    assert(
      !detailData.data.student.password,
      "Student password is safely omitted from response"
    );
    assert(
      Array.isArray(detailData.data.requests) &&
        detailData.data.requests.some((r) => r._id === createdRequestId),
      "Student Alpha's associated service request is included in detail payload"
    );

    // ---------------------------------------------------------
    // TEST 6: Validation & Error Handling
    // ---------------------------------------------------------
    console.log("\n[6] Validation & Edge Case Handling");

    // Invalid ObjectId format
    const invalidIdRes = await fetch(`${BASE_URL}/admin/students/invalid-id-xyz`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const invalidIdData = await invalidIdRes.json();
    assert(
      invalidIdRes.status === 400 && invalidIdData.success === false,
      "Invalid ObjectId returns 400 Bad Request with readable message"
    );

    // Non-existent ObjectId
    const fakeId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await fetch(`${BASE_URL}/admin/students/${fakeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notFoundData = await notFoundRes.json();
    assert(
      notFoundRes.status === 404 && notFoundData.success === false,
      "Non-existent student ID returns 404 Not Found"
    );

    // ---------------------------------------------------------
    // TEST 7: Role-Based Security Enforcement (Access Control)
    // ---------------------------------------------------------
    console.log("\n[7] Role-Based Security Enforcement (Students Blocked)");

    // Student attempting to list all students
    const studentListRes = await fetch(`${BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    assert(
      studentListRes.status === 403,
      "Student calling GET /api/admin/students is blocked with 403 Forbidden"
    );

    // Student attempting to get student detail
    const studentDetailRes = await fetch(
      `${BASE_URL}/admin/students/${student2Id}`,
      { headers: { Authorization: `Bearer ${student1Token}` } }
    );
    assert(
      studentDetailRes.status === 403,
      "Student calling GET /api/admin/students/:id is blocked with 403 Forbidden"
    );

    // Unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/admin/students`);
    assert(
      unauthRes.status === 401,
      "Unauthenticated request to GET /api/admin/students is blocked with 401 Unauthorized"
    );
  } catch (err) {
    failedCount++;
    console.error("Test execution encountered an unhandled error:", err.message);
  } finally {
    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------
    console.log("\n[Cleanup] Removing temporary test records from MongoDB Atlas...");
    try {
      if (createdRequestId) {
        await ServiceRequest.findByIdAndDelete(createdRequestId);
      }
      await User.deleteMany({
        email: { $in: [testStudent1Email, testStudent2Email] },
      });
      console.log("  [DONE] Test students and requests cleaned up successfully.");
    } catch (cleanErr) {
      console.error("  [WARN] Cleanup encountered error:", cleanErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n========================================================");
    console.log(`Phase 4 Verification Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase4Tests();
