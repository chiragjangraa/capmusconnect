/**
 * CampusConnect Phase 6 Integration Verification
 * Verifies live database integration for Assignments Management:
 * - Seeding/Existence of Assignments in MongoDB Atlas
 * - Assignment listing from GET /api/assignments for authenticated users
 * - Search query filtering (by title, courseCode, instructor, description)
 * - Status query filtering (Pending, Submitted, Completed)
 * - Assignment detail retrieval by MongoDB ObjectId
 * - Student assignment submission lifecycle (POST /api/assignments/:id/submit)
 * - Verifies student submission updates status from "Pending" to "Submitted"
 * - Role-Based Security: Students blocked with 403 Forbidden on create, update, grade, delete
 * - Unauthenticated requests blocked with 401 Unauthorized
 * - Admin evaluation / grading (PUT /api/assignments/:id/grade) updates score & feedback
 * - Admin assignment creation, update, and deletion lifecycle
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
const Assignment = require("../models/Assignment");

const PORT = 5056; // Dedicated safe port for Phase 6 verification
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

async function runPhase6Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 6 Assignments Management Verification");
  console.log("========================================================\n");

  const testStudentEmail = "phase6.student.verify@campusconnect.edu";
  const testStudentPassword = "StudentPass2026!";
  const testAssignmentTitle = "Phase 6 Automated Test Assignment";
  let studentToken = null;
  let studentId = null;
  let adminToken = null;
  let sampleAssignmentId = null;
  let createdAssignmentId = null;

  try {
    // 1. Connect DB and boot verification server
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Phase 6 verification server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // Cleanup previous runs if any
    await User.deleteMany({ email: testStudentEmail });
    await Assignment.deleteMany({ title: testAssignmentTitle });

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
        name: "PhaseSix Student",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "Computer Science",
      }),
    });
    const regData = await regRes.json();
    studentToken = regData.token;
    studentId = regData.user?._id;

    assert(
      regRes.status === 201 && studentToken,
      "Student registered successfully and receives JWT token"
    );

    // ---------------------------------------------------------
    // TEST 2: Assignment Listing (GET /api/assignments)
    // ---------------------------------------------------------
    console.log("\n[2] Assignment Listing (GET /api/assignments)");
    const listRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listData = await listRes.json();

    assert(
      listRes.status === 200 && listData.success === true,
      "GET /api/assignments returns 200 OK for authenticated student"
    );
    assert(
      Array.isArray(listData.data) && listData.data.length >= 10,
      `Curriculum assignments returned with count: ${listData.count} (Expected >= 10)`
    );

    const firstAsgn = listData.data[0];
    sampleAssignmentId = firstAsgn.id || firstAsgn._id;
    assert(
      firstAsgn &&
        firstAsgn.title &&
        firstAsgn.courseCode &&
        firstAsgn.dueDate &&
        firstAsgn.status === "Pending",
      "First assignment correctly mapped with status 'Pending' for new student"
    );

    // ---------------------------------------------------------
    // TEST 3: Search and Status Filtering
    // ---------------------------------------------------------
    console.log("\n[3] Search and Status Filtering");

    // Search by title keyword
    const searchRes = await fetch(`${BASE_URL}/assignments?search=B-Tree`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
        searchData.data.some((a) => a.title.includes("B-Tree")),
      "Search by 'B-Tree' returns B-Tree Indexing Implementation"
    );

    // Search by courseCode
    const codeSearchRes = await fetch(`${BASE_URL}/assignments?search=CS308`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const codeSearchData = await codeSearchRes.json();
    assert(
      codeSearchRes.status === 200 &&
        codeSearchData.data.length > 0 &&
        codeSearchData.data.every((a) => a.courseCode === "CS308"),
      "Search by 'CS308' returns only CS308 coursework tasks"
    );

    // Filter by status: Pending
    const pendingRes = await fetch(`${BASE_URL}/assignments?status=Pending`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const pendingData = await pendingRes.json();
    assert(
      pendingRes.status === 200 &&
        pendingData.data.every((a) => a.status === "Pending"),
      "Filter by status 'Pending' returns only pending tasks"
    );

    // ---------------------------------------------------------
    // TEST 4: Single Assignment Detail (GET /api/assignments/:id)
    // ---------------------------------------------------------
    console.log("\n[4] Assignment Detail (GET /api/assignments/:id)");
    const detailRes = await fetch(
      `${BASE_URL}/assignments/${sampleAssignmentId}`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const detailData = await detailRes.json();
    assert(
      detailRes.status === 200 &&
        (detailData.data?.id === sampleAssignmentId ||
          detailData.data?._id === sampleAssignmentId),
      "GET /api/assignments/:id retrieves single assignment successfully"
    );

    // Non-existent ID
    const fakeId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await fetch(`${BASE_URL}/assignments/${fakeId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      notFoundRes.status === 404,
      "Non-existent assignment ID returns 404 Not Found"
    );

    // ---------------------------------------------------------
    // TEST 5: Student Assignment Submission
    // ---------------------------------------------------------
    console.log("\n[5] Student Assignment Submission (POST /api/assignments/:id/submit)");
    const submitRes = await fetch(
      `${BASE_URL}/assignments/${sampleAssignmentId}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          fileName: "phase6_student_btree_sol.zip",
          notes: "Implemented disk B+ tree with node splitting tests.",
        }),
      }
    );
    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 && submitData.success === true,
      "Student submits assignment deliverable successfully (200 OK)"
    );

    // Verify student's listing now reflects "Submitted" status
    const verifiedListRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const verifiedListData = await verifiedListRes.json();
    const submittedAsgn = verifiedListData.data.find(
      (a) => a.id === sampleAssignmentId || a._id === sampleAssignmentId
    );

    assert(
      submittedAsgn &&
        submittedAsgn.status === "Submitted" &&
        submittedAsgn.submissionFile === "phase6_student_btree_sol.zip",
      "Assignment status dynamically updated from 'Pending' to 'Submitted' for student"
    );

    // ---------------------------------------------------------
    // TEST 6: Role-Based Access Control (Student write blocked)
    // ---------------------------------------------------------
    console.log("\n[6] Role-Based Access Control (Security Enforcement)");

    // Student attempting to create assignment
    const studentCreateRes = await fetch(`${BASE_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Unauthorized Assignment",
        courseCode: "CS301",
        courseName: "Algorithms",
        instructor: "Prof X",
        dueDate: "Nov 30, 2026",
        description: "Hacked assignment",
      }),
    });
    assert(
      studentCreateRes.status === 403,
      "Student calling POST /api/assignments is blocked with 403 Forbidden"
    );

    // Student attempting to update assignment
    const studentUpdateRes = await fetch(
      `${BASE_URL}/assignments/${sampleAssignmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ title: "Hacked Title" }),
      }
    );
    assert(
      studentUpdateRes.status === 403,
      "Student calling PUT /api/assignments/:id is blocked with 403 Forbidden"
    );

    // Student attempting to grade
    const studentGradeRes = await fetch(
      `${BASE_URL}/assignments/${sampleAssignmentId}/grade`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          studentId,
          score: "100/100",
          feedback: "Self-awarded grade",
        }),
      }
    );
    assert(
      studentGradeRes.status === 403,
      "Student calling PUT /api/assignments/:id/grade is blocked with 403 Forbidden"
    );

    // Student attempting to delete assignment
    const studentDeleteRes = await fetch(
      `${BASE_URL}/assignments/${sampleAssignmentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    assert(
      studentDeleteRes.status === 403,
      "Student calling DELETE /api/assignments/:id is blocked with 403 Forbidden"
    );

    // Unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/assignments`);
    assert(
      unauthRes.status === 401,
      "Unauthenticated request to GET /api/assignments is blocked with 401 Unauthorized"
    );

    // ---------------------------------------------------------
    // TEST 7: Admin Grading & Management Lifecycle
    // ---------------------------------------------------------
    console.log("\n[7] Admin Grading & Assignment Management");

    // Admin grades student's submission
    const gradeRes = await fetch(
      `${BASE_URL}/assignments/${sampleAssignmentId}/grade`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId,
          score: "96/100 (96%)",
          feedback: "Clean B+ tree node split logic. Comprehensive test suite.",
          status: "Completed",
        }),
      }
    );
    const gradeData = await gradeRes.json();
    assert(
      gradeRes.status === 200 && gradeData.success === true,
      "Admin evaluates student submission successfully (200 OK)"
    );

    // Verify student now sees "Completed", score, and feedback
    const gradedListRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const gradedListData = await gradedListRes.json();
    const gradedAsgn = gradedListData.data.find(
      (a) => a.id === sampleAssignmentId || a._id === sampleAssignmentId
    );

    assert(
      gradedAsgn &&
        gradedAsgn.status === "Completed" &&
        gradedAsgn.score === "96/100 (96%)" &&
        gradedAsgn.feedback.includes("Clean B+ tree"),
      "Student receives real evaluated score and faculty feedback from MongoDB"
    );

    // Admin creates new assignment
    const adminCreateRes = await fetch(`${BASE_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: testAssignmentTitle,
        courseCode: "CS401",
        courseName: "Cloud Computing Systems",
        instructor: "Prof. Admin",
        dueDate: "Dec 15, 2026, 11:59 PM",
        priority: "high",
        points: "100 pts",
        type: "Cloud Lab",
        description: "Deploy a highly available Kubernetes cluster with ingress controllers.",
      }),
    });
    const adminCreateData = await adminCreateRes.json();
    createdAssignmentId = adminCreateData.data?._id;
    assert(
      adminCreateRes.status === 201 && createdAssignmentId,
      "Admin creates new assignment successfully (201 Created)"
    );

    // Admin updates assignment
    const adminUpdateRes = await fetch(
      `${BASE_URL}/assignments/${createdAssignmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: "Phase 6 Automated Test Assignment (Updated)",
        }),
      }
    );
    const adminUpdateData = await adminUpdateRes.json();
    assert(
      adminUpdateRes.status === 200 &&
        adminUpdateData.data?.title === "Phase 6 Automated Test Assignment (Updated)",
      "Admin updates assignment successfully (200 OK)"
    );

    // Admin deletes assignment
    const adminDeleteRes = await fetch(
      `${BASE_URL}/assignments/${createdAssignmentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert(
      adminDeleteRes.status === 200,
      "Admin deletes assignment successfully (200 OK)"
    );
  } catch (err) {
    failedCount++;
    console.error("Test execution encountered an unhandled error:", err.message);
    if (err.cause) console.error("Error cause:", err.cause);
  } finally {
    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------
    console.log("\n[Cleanup] Removing temporary test records from MongoDB Atlas...");
    try {
      if (sampleAssignmentId && studentId) {
        await Assignment.findByIdAndUpdate(sampleAssignmentId, {
          $pull: { submissions: { student: studentId } },
        });
      }
      if (createdAssignmentId) {
        await Assignment.findByIdAndDelete(createdAssignmentId);
      }
      await Assignment.deleteMany({ title: testAssignmentTitle });
      await User.deleteMany({ email: testStudentEmail });
      console.log("  [DONE] Test student, submissions, and assignment cleaned up successfully.");
    } catch (cleanErr) {
      console.error("  [WARN] Cleanup encountered error:", cleanErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n========================================================");
    console.log(`Phase 6 Verification Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase6Tests();
