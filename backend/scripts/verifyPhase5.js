/**
 * CampusConnect Phase 5 Integration Verification
 * Verifies live database integration for Courses Management:
 * - Seeding/Existence of Courses in MongoDB Atlas
 * - Course listing from GET /api/courses for authenticated students and admins
 * - Course search filtering (by title, code, description, faculty)
 * - Category and Department query filtering
 * - Course detail retrieval by course code (e.g. CS301) and MongoDB _id
 * - Validates 404 response for non-existent courses
 * - Strict Role-Based Security: Students blocked with 403 Forbidden on POST/PUT/DELETE
 * - Unauthenticated requests blocked with 401 Unauthorized
 * - Admin course creation, update, and deletion
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
const Course = require("../models/Course");

const PORT = 5059; // Dedicated port for Phase 5 verification
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

async function runPhase5Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 5 Courses Management Verification");
  console.log("========================================================\n");

  const testStudentEmail = "phase5.student.verify@campusconnect.edu";
  const testStudentPassword = "StudentPass2026!";
  const testCourseCode = "TEST999";
  let studentToken = null;
  let adminToken = null;
  let sampleCourseId = null;

  try {
    // 1. Connect DB and boot verification server
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Phase 5 verification server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // Cleanup previous runs if any
    await User.deleteMany({ email: testStudentEmail });
    await Course.deleteMany({ code: testCourseCode });

    // ---------------------------------------------------------
    // TEST 1: Authenticate Admin & Student
    // ---------------------------------------------------------
    console.log("[1] Authentication Setup");
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
    adminToken = adminLoginData.token;

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "PhaseFive Student",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "Computer Science",
      }),
    });
    const regData = await regRes.json();
    studentToken = regData.token;

    assert(
      regRes.status === 201 && studentToken,
      "Student registered successfully and receives JWT token"
    );

    // ---------------------------------------------------------
    // TEST 2: Course Listing (GET /api/courses)
    // ---------------------------------------------------------
    console.log("\n[2] Course Listing (GET /api/courses)");
    const listRes = await fetch(`${BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listData = await listRes.json();

    assert(
      listRes.status === 200 && listData.success === true,
      "GET /api/courses returns 200 OK for authenticated student"
    );
    assert(
      Array.isArray(listData.data) && listData.data.length >= 8,
      `Curriculum courses returned with count: ${listData.count} (Expected >= 8)`
    );

    const firstCourse = listData.data[0];
    sampleCourseId = firstCourse._id;
    assert(
      firstCourse &&
        firstCourse.code &&
        firstCourse.title &&
        firstCourse.credits &&
        firstCourse.faculty &&
        Array.isArray(firstCourse.syllabus),
      "Course payload contains code, title, credits, faculty, and syllabus"
    );

    // ---------------------------------------------------------
    // TEST 3: Search and Category / Department Filtering
    // ---------------------------------------------------------
    console.log("\n[3] Search and Category / Department Filtering");

    // Search by code
    const codeSearchRes = await fetch(`${BASE_URL}/courses?search=CS301`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const codeSearchData = await codeSearchRes.json();
    assert(
      codeSearchRes.status === 200 &&
        codeSearchData.data.some((c) => c.code === "CS301"),
      "Search by 'CS301' returns course CS301"
    );

    // Search by keyword
    const keySearchRes = await fetch(`${BASE_URL}/courses?search=Database`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const keySearchData = await keySearchRes.json();
    assert(
      keySearchRes.status === 200 &&
        keySearchData.data.some((c) => c.code === "CS304"),
      "Search by 'Database' returns CS304 (Database Management Systems)"
    );

    // Category filter
    const catRes = await fetch(
      `${BASE_URL}/courses?category=Laboratory%20Course`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const catData = await catRes.json();
    assert(
      catRes.status === 200 &&
        catData.data.length > 0 &&
        catData.data.every((c) => c.category === "Laboratory Course"),
      "Filter by 'Laboratory Course' returns only Laboratory courses"
    );

    // Department filter
    const deptRes = await fetch(
      `${BASE_URL}/courses?department=Mathematics%20%26%20Sciences`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const deptData = await deptRes.json();
    assert(
      deptRes.status === 200 &&
        deptData.data.some((c) => c.code === "MA302"),
      "Filter by 'Mathematics & Sciences' returns MA302"
    );

    // ---------------------------------------------------------
    // TEST 4: Course Detail by Code and ObjectId
    // ---------------------------------------------------------
    console.log("\n[4] Course Detail (GET /api/courses/:id)");

    // By course code
    const codeDetailRes = await fetch(`${BASE_URL}/courses/CS301`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const codeDetailData = await codeDetailRes.json();
    assert(
      codeDetailRes.status === 200 && codeDetailData.data?.code === "CS301",
      "GET /api/courses/CS301 resolves course by code successfully"
    );

    // By MongoDB ObjectId
    const idDetailRes = await fetch(`${BASE_URL}/courses/${sampleCourseId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const idDetailData = await idDetailRes.json();
    assert(
      idDetailRes.status === 200 && idDetailData.data?._id === sampleCourseId,
      "GET /api/courses/:id resolves course by MongoDB ObjectId successfully"
    );

    // Non-existent course
    const notFoundRes = await fetch(`${BASE_URL}/courses/NONEXISTENT999`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      notFoundRes.status === 404,
      "GET /api/courses/NONEXISTENT999 returns 404 Not Found"
    );

    // ---------------------------------------------------------
    // TEST 5: Role-Based Access Control (Student write blocked)
    // ---------------------------------------------------------
    console.log("\n[5] Role-Based Access Control (Security Enforcement)");

    // Student attempting to create course
    const studentCreateRes = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        code: testCourseCode,
        title: "Unauthorized Course",
        department: "Computer Science",
        description: "Should be blocked",
      }),
    });
    assert(
      studentCreateRes.status === 403,
      "Student calling POST /api/courses is blocked with 403 Forbidden"
    );

    // Student attempting to update course
    const studentUpdateRes = await fetch(`${BASE_URL}/courses/CS301`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ title: "Hacked Title" }),
    });
    assert(
      studentUpdateRes.status === 403,
      "Student calling PUT /api/courses/:id is blocked with 403 Forbidden"
    );

    // Student attempting to delete course
    const studentDeleteRes = await fetch(`${BASE_URL}/courses/CS301`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentDeleteRes.status === 403,
      "Student calling DELETE /api/courses/:id is blocked with 403 Forbidden"
    );

    // Unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/courses`);
    assert(
      unauthRes.status === 401,
      "Unauthenticated request to GET /api/courses is blocked with 401 Unauthorized"
    );

    // ---------------------------------------------------------
    // TEST 6: Admin Course Management Lifecycle (Create, Update, Delete)
    // ---------------------------------------------------------
    console.log("\n[6] Admin Course Management Lifecycle");

    // Admin creates course
    const adminCreateRes = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: testCourseCode,
        title: "Distributed Systems & Fault Tolerance",
        department: "Computer Science & Engineering",
        category: "Core Engineering",
        credits: 4,
        description: "Raft consensus, Paxos, and Byzantine Fault Tolerance.",
        faculty: {
          name: "Dr. Admin Instructor",
          role: "Professor",
          department: "Computer Science",
          email: "admin.inst@campusconnect.edu",
        },
        syllabus: [
          {
            week: "Week 1",
            title: "Consensus Protocols",
            description: "Paxos vs Raft",
            status: "Completed",
          },
        ],
      }),
    });
    const adminCreateData = await adminCreateRes.json();
    assert(
      adminCreateRes.status === 201 && adminCreateData.data?.code === testCourseCode,
      "Admin creates new course successfully (201 Created)"
    );

    // Admin updates course
    const adminUpdateRes = await fetch(`${BASE_URL}/courses/${testCourseCode}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Distributed Systems & Byzantine Consensus",
      }),
    });
    const adminUpdateData = await adminUpdateRes.json();
    assert(
      adminUpdateRes.status === 200 &&
        adminUpdateData.data?.title === "Distributed Systems & Byzantine Consensus",
      "Admin updates course successfully (200 OK)"
    );

    // Admin deletes course
    const adminDeleteRes = await fetch(`${BASE_URL}/courses/${testCourseCode}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminDeleteRes.status === 200,
      "Admin deletes course successfully (200 OK)"
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
      await User.deleteMany({ email: testStudentEmail });
      await Course.deleteMany({ code: testCourseCode });
      console.log("  [DONE] Test student and course cleaned up successfully.");
    } catch (cleanErr) {
      console.error("  [WARN] Cleanup encountered error:", cleanErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n========================================================");
    console.log(`Phase 5 Verification Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase5Tests();
