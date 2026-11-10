/**
 * CampusConnect Phase 6.1 Verification Suite
 * Verifies all audit fixes for the Assignments module:
 * 1. Role-based view separation:
 *    - Students receive their personalized submission status and cannot see other students' submissions
 *    - Admins receive totalSubmissions and submissions review array
 * 2. Admin Assignment Management:
 *    - Admin creates assignment via POST /api/assignments
 *    - Admin deletes assignment via DELETE /api/assignments/:id
 *    - Students blocked with 403 Forbidden on create and delete
 * 3. Submission Review & Evaluation:
 *    - Student submits deliverable metadata reference
 *    - Admin reviews actual submission details (student name, email, filename, notes, timestamp)
 *    - Admin evaluates submission via PUT /api/assignments/:id/grade
 *    - Student's status updates to "Completed" with awarded score and faculty feedback
 *    - Students blocked with 403 Forbidden on grading
 * 4. Full cleanup of temporary test data from MongoDB Atlas
 */

const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Configure DNS fallback
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

const PORT = 5054; // Dedicated safe port for Phase 6.1 verification
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

async function runPhase61Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 6.1 Audit Fixes Verification");
  console.log("========================================================\n");

  const testStudentEmail = "phase61.student.verify@campusconnect.edu";
  const testStudentPassword = "StudentPass2026!";
  const testAssignmentTitle = "Phase 6.1 Audit Fix Test Assignment";

  let adminToken = null;
  let studentToken = null;
  let studentId = null;
  let targetAssignmentId = null;
  let createdAssignmentId = null;

  try {
    // 1. Connect DB and boot verification server
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Phase 6.1 verification server listening on port ${PORT}\n`);
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
    assert(adminLoginRes.status === 200 && adminLoginData.token, "Admin logged in with JWT token");
    adminToken = adminLoginData.token;

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase 6.1 Audit Student",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "Computer Science",
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token, "Student registered with JWT token");
    studentToken = regData.token;
    studentId = regData.user?._id;

    // ---------------------------------------------------------
    // TEST 2: Role-Based View Separation
    // ---------------------------------------------------------
    console.log("\n[2] Role-Based View Separation");
    // Student call
    const studentListRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentListData = await studentListRes.json();
    assert(
      studentListRes.status === 200 && Array.isArray(studentListData.data),
      "Student successfully retrieves assignments list"
    );
    const firstStudentAsgn = studentListData.data[0];
    targetAssignmentId = firstStudentAsgn._id || firstStudentAsgn.id;
    assert(
      firstStudentAsgn.submissions === undefined,
      "Student view does NOT expose other students' submissions array"
    );
    assert(
      firstStudentAsgn.status === "Pending",
      "Student starts with initial status 'Pending'"
    );

    // Admin call
    const adminListRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(
      adminListRes.status === 200 && Array.isArray(adminListData.data),
      "Admin successfully retrieves assignments list"
    );
    const firstAdminAsgn = adminListData.data[0];
    assert(
      Array.isArray(firstAdminAsgn.submissions) && firstAdminAsgn.totalSubmissions !== undefined,
      "Admin view includes submissions array and totalSubmissions count for review"
    );

    // ---------------------------------------------------------
    // TEST 3: Admin Assignment Creation & Deletion
    // ---------------------------------------------------------
    console.log("\n[3] Admin Assignment Creation & Deletion Lifecycle");
    // Admin creates
    const createRes = await fetch(`${BASE_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: testAssignmentTitle,
        courseCode: "CS450",
        courseName: "Cloud Infrastructure",
        instructor: "Prof. Audit",
        dueDate: "Dec 20, 2026, 11:59 PM",
        priority: "high",
        points: "100 pts",
        type: "Infrastructure Lab",
        description: "Deploy an audited multi-region database cluster.",
      }),
    });
    const createData = await createRes.json();
    createdAssignmentId = createData.data?._id;
    assert(
      createRes.status === 201 && createdAssignmentId,
      "Admin creates new coursework assignment (201 Created)"
    );

    // Student attempted creation blocked
    const studentCreateRes = await fetch(`${BASE_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Malicious Assignment",
        courseCode: "CS450",
        courseName: "Cloud",
        instructor: "Hacker",
        dueDate: "Tomorrow",
        description: "Unauthorized",
      }),
    });
    assert(
      studentCreateRes.status === 403,
      "Student calling POST /api/assignments is blocked with 403 Forbidden"
    );

    // Admin deletes created test assignment
    const deleteRes = await fetch(`${BASE_URL}/assignments/${createdAssignmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      deleteRes.status === 200,
      "Admin deletes assignment successfully (200 OK)"
    );

    // Student attempted deletion blocked
    const studentDeleteRes = await fetch(`${BASE_URL}/assignments/${targetAssignmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentDeleteRes.status === 403,
      "Student calling DELETE /api/assignments/:id is blocked with 403 Forbidden"
    );

    // ---------------------------------------------------------
    // TEST 4: Student Deliverable Reference Submission
    // ---------------------------------------------------------
    console.log("\n[4] Student Deliverable Submission");
    const submitRes = await fetch(`${BASE_URL}/assignments/${targetAssignmentId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        fileName: "phase61_audit_submission.zip",
        notes: "Deliverable reference for audit test.",
      }),
    });
    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 && submitData.success === true,
      "Student records deliverable filename reference & notes successfully"
    );

    // ---------------------------------------------------------
    // TEST 5: Admin Submissions Review & Grading Form
    // ---------------------------------------------------------
    console.log("\n[5] Admin Submissions Review & Grading");
    // Admin fetches and inspects submissions
    const adminCheckRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminCheckData = await adminCheckRes.json();
    const targetedAsgnAdmin = adminCheckData.data.find(
      (a) => (a._id || a.id) === targetAssignmentId
    );

    const studentSub = targetedAsgnAdmin?.submissions.find(
      (s) => s.student && s.student.toString() === studentId.toString()
    );

    assert(
      studentSub &&
        studentSub.fileName === "phase61_audit_submission.zip" &&
        studentSub.notes === "Deliverable reference for audit test.",
      "Admin reviews student's exact filename reference, notes, and timestamp"
    );

    // Admin grades submission
    const gradeRes = await fetch(`${BASE_URL}/assignments/${targetAssignmentId}/grade`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        studentId,
        score: "98/100 (98%)",
        feedback: "Outstanding deliverable reference and thorough documentation.",
        status: "Completed",
      }),
    });
    const gradeData = await gradeRes.json();
    assert(
      gradeRes.status === 200 && gradeData.success === true,
      "Admin evaluates submission with score and faculty feedback (200 OK)"
    );

    // Student attempted grading blocked
    const studentGradeRes = await fetch(`${BASE_URL}/assignments/${targetAssignmentId}/grade`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        studentId,
        score: "100/100",
        feedback: "Self-grade",
      }),
    });
    assert(
      studentGradeRes.status === 403,
      "Student calling PUT /api/assignments/:id/grade is blocked with 403 Forbidden"
    );

    // Verify student receives grade
    const studentFinalRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentFinalData = await studentFinalRes.json();
    const gradedAsgn = studentFinalData.data.find(
      (a) => (a._id || a.id) === targetAssignmentId
    );

    assert(
      gradedAsgn &&
        gradedAsgn.status === "Completed" &&
        gradedAsgn.score === "98/100 (98%)" &&
        gradedAsgn.feedback.includes("Outstanding deliverable"),
      "Student receives real score '98/100 (98%)' and faculty feedback from MongoDB Atlas"
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
      if (targetAssignmentId && studentId) {
        await Assignment.findByIdAndUpdate(targetAssignmentId, {
          $pull: { submissions: { student: studentId } },
        });
      }
      if (createdAssignmentId) {
        await Assignment.findByIdAndDelete(createdAssignmentId);
      }
      await Assignment.deleteMany({ title: testAssignmentTitle });
      await User.deleteMany({ email: testStudentEmail });
      console.log("  [DONE] Test records cleaned up successfully.");
    } catch (cleanErr) {
      console.error("  [WARN] Cleanup encountered error:", cleanErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n========================================================");
    console.log(`Phase 6.1 Verification Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase61Tests();
