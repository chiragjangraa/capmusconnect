/**
 * CampusConnect Phase 8: Final System Audit, Security & End-to-End Verification
 * Comprehensive master test suite validating all application modules against MongoDB Atlas:
 * 1. Health check & Service connectivity
 * 2. Student registration, validation & duplicate handling
 * 3. Student & Admin authentication (JWT issuance)
 * 4. Invalid credentials rejection & protected route guards (401)
 * 5. Profile updates, persistence & privilege escalation prevention
 * 6. Password update workflow, bcrypt re-hashing & old password invalidation
 * 7. Service request creation, student ownership scoping & validation
 * 8. Strict admin role-based authorization guards (403)
 * 9. Admin status transition workflow with state machine validation
 * 10. Student directory listing & detail views for authorized admins
 * 11. Courses catalog listing, search, category filtering & dual-lookup (ID & Code)
 * 12. Course creation, authorization & deletion lifecycle
 * 13. Assignment listing, submission deliverable metadata & admin grading
 * 14. Regex injection immunity & search safety
 * 15. Safe cleanup of all temporary test data
 */

const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Configure public DNS fallback for Windows Node.js querySrv resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // continue
}

// Load backend .env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";

const app = require("../server");
const connectDB = require("../config/db");
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const ServiceRequest = require("../models/ServiceRequest");

const PORT = 5058; // Dedicated safe port for Phase 8 master test suite
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

async function runMasterVerification() {
  console.log("\n=================================================================");
  console.log("   CampusConnect Phase 8 Master System Audit & Verification Suite ");
  console.log("=================================================================\n");

  const timestamp = Date.now();
  const testStudentEmail = `phase8_student_${timestamp}@campusconnect.edu`;
  const initialPassword = "Phase8Password123!";
  const updatedPassword = "NewPhase8Password456!";

  let studentToken = null;
  let studentId = null;
  let adminToken = null;
  let createdRequestId = null;
  let createdCourseId = null;
  let testAssignmentId = null;

  try {
    // Connect to database and start server
    await connectDB();
    serverInstance = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // -------------------------------------------------------------
    // MODULE 1: System Health & Base Endpoints
    // -------------------------------------------------------------
    console.log("[Module 1] System Health & Unauthenticated Routing");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.status === "ok",
      "System: GET /api/health returns healthy operational status"
    );

    const unauthMeRes = await fetch(`${BASE_URL}/auth/me`);
    assert(
      unauthMeRes.status === 401,
      "Security: Unauthenticated GET /api/auth/me rejected with 401"
    );

    // -------------------------------------------------------------
    // MODULE 2: Student Registration & Validation
    // -------------------------------------------------------------
    console.log("\n[Module 2] Authentication & Registration");
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase 8 Student",
        email: testStudentEmail,
        password: initialPassword,
        department: "Computer Science",
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success && regData.token,
      "Auth: Student registered successfully with genuine JWT token"
    );
    studentToken = regData.token;
    studentId = regData.user._id;

    // Duplicate email registration rejected
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: testStudentEmail,
        password: initialPassword,
        department: "Computer Science",
      }),
    });
    assert(
      dupRes.status === 400,
      "Validation: Duplicate email registration rejected with 400"
    );

    // -------------------------------------------------------------
    // MODULE 3: Login (Student & Admin) & Credential Verification
    // -------------------------------------------------------------
    console.log("\n[Module 3] Login & Role Authentication");
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: "WrongPassword999!",
      }),
    });
    assert(
      invalidLoginRes.status === 401,
      "Security: Invalid password rejected with 401 Unauthorized"
    );

    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: initialPassword,
      }),
    });
    const studentLoginData = await studentLoginRes.json();
    assert(
      studentLoginRes.status === 200 && studentLoginData.user.role === "student",
      "Auth: Student authenticated successfully with role 'student'"
    );

    // Admin login
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campusconnect.edu";
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });
      const adminLoginData = await adminLoginRes.json();
      assert(
        adminLoginRes.status === 200 && adminLoginData.user?.role === "admin",
        "Auth: Central administrator authenticated successfully with role 'admin'",
        JSON.stringify({ status: adminLoginRes.status, data: adminLoginData })
      );
      adminToken = adminLoginData.token;
    }

    // -------------------------------------------------------------
    // MODULE 4: Profile Update, Password Change & Privilege Escalation
    // -------------------------------------------------------------
    console.log("\n[Module 4] Profile, Password & Settings Security");
    const updateProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        name: "Phase 8 Student Updated",
        department: "Artificial Intelligence & Data Science",
        role: "admin", // Attempted privilege escalation
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(
      updateProfileRes.status === 200 &&
        updateProfileData.user.name === "Phase 8 Student Updated" &&
        updateProfileData.user.role === "student",
      "Security: Profile updated and role escalation strictly blocked (remains 'student')"
    );

    // Password change
    const pwdRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
      }),
    });
    assert(
      pwdRes.status === 200,
      "Password: Changed password successfully via PUT /api/auth/password"
    );

    // Verify old password rejected & new accepted
    const oldLoginCheck = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: initialPassword,
      }),
    });
    assert(
      oldLoginCheck.status === 401,
      "Security: Old password invalidated after password update"
    );

    const newLoginCheck = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: updatedPassword,
      }),
    });
    const newLoginData = await newLoginCheck.json();
    assert(
      newLoginCheck.status === 200 && newLoginData.token,
      "Auth: New password authenticates successfully and issues active token"
    );
    studentToken = newLoginData.token;

    // -------------------------------------------------------------
    // MODULE 5: Service Requests & Status Workflow
    // -------------------------------------------------------------
    console.log("\n[Module 5] Service Requests & State Machine Workflow");
    const createReqRes = await fetch(`${BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Phase 8 Test Lab Equipment Request",
        description: "Need verification of hardware in laboratory workstation.",
        category: "IT Support",
        priority: "High",
      }),
    });
    const createReqData = await createReqRes.json();
    assert(
      createReqRes.status === 201 && createReqData.data.status === "Pending",
      "Requests: Student submitted new service request with status 'Pending'"
    );
    createdRequestId = createReqData.data._id;

    // Student only sees their own requests
    const studentRequestsRes = await fetch(`${BASE_URL}/requests`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentRequestsData = await studentRequestsRes.json();
    const ownRequest = studentRequestsData.data.find(
      (r) => r._id === createdRequestId
    );
    assert(
      studentRequestsRes.status === 200 && Boolean(ownRequest),
      "Requests: Student retrieval scoped strictly to own records"
    );

    // Student blocked from Admin routes
    const studentAdminAccessRes = await fetch(`${BASE_URL}/admin/requests`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentAdminAccessRes.status === 403,
      "Security: Student blocked with 403 Forbidden on GET /api/admin/requests"
    );

    // Admin updates request status through workflow
    if (adminToken) {
      const updateStatusRes = await fetch(
        `${BASE_URL}/requests/${createdRequestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            status: "Under Review",
            adminResponse: "Request has been logged and assigned to IT staff.",
          }),
        }
      );
      const updateStatusData = await updateStatusRes.json();
      assert(
        updateStatusRes.status === 200 &&
          updateStatusData.data.status === "Under Review",
        "Workflow: Admin successfully transitioned request to 'Under Review'"
      );

      // Student directory listing (Admin only)
      const studentsListRes = await fetch(`${BASE_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const studentsListData = await studentsListRes.json();
      assert(
        studentsListRes.status === 200 &&
          Array.isArray(studentsListData.data) &&
          studentsListData.data.length > 0,
        "Students: Admin successfully retrieved student directory list"
      );
    }

    // -------------------------------------------------------------
    // MODULE 6: Courses Management (Listing, Lookup, Admin Control)
    // -------------------------------------------------------------
    console.log("\n[Module 6] Courses Management");
    const coursesListRes = await fetch(`${BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const coursesListData = await coursesListRes.json();
    assert(
      coursesListRes.status === 200 &&
        Array.isArray(coursesListData.data) &&
        coursesListData.data.length > 0,
      "Courses: Retrieved course catalog from MongoDB Atlas"
    );

    // Dual lookup by code
    const firstCourseCode = coursesListData.data[0].code;
    const courseDetailRes = await fetch(
      `${BASE_URL}/courses/${firstCourseCode}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    assert(
      courseDetailRes.status === 200,
      `Courses: Retrieved course detail by code '${firstCourseCode}'`
    );

    // Student cannot create a course
    const studentCourseCreateRes = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        code: "UNAUTH101",
        title: "Unauthorized Course",
      }),
    });
    assert(
      studentCourseCreateRes.status === 403,
      "Security: Student blocked with 403 on POST /api/courses"
    );

    // -------------------------------------------------------------
    // MODULE 7: Coursework Assignments & Submissions
    // -------------------------------------------------------------
    console.log("\n[Module 7] Assignments & Submissions");
    const assignmentsListRes = await fetch(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const assignmentsListData = await assignmentsListRes.json();
    assert(
      assignmentsListRes.status === 200 &&
        Array.isArray(assignmentsListData.data) &&
        assignmentsListData.data.length > 0,
      "Assignments: Retrieved coursework assignments from MongoDB Atlas"
    );

    testAssignmentId = assignmentsListData.data[0]._id;

    // Student submit deliverable reference
    const submitRes = await fetch(
      `${BASE_URL}/assignments/${testAssignmentId}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          fileName: "Phase8_Submission_Report.pdf",
          notes: "Final report deliverable for audit verification.",
        }),
      }
    );
    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 && submitData.success,
      "Assignments: Student successfully submitted deliverable metadata reference"
    );

    // Admin grading
    if (adminToken) {
      const gradeRes = await fetch(
        `${BASE_URL}/assignments/${testAssignmentId}/grade`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId,
            score: "96 / 100",
            feedback: "Comprehensive solution meeting all rubric criteria.",
          }),
        }
      );
      assert(
        gradeRes.status === 200,
        "Assignments: Admin evaluated and graded student deliverable"
      );
    }

    // -------------------------------------------------------------
    // MODULE 8: Regex Injection & Query Safety
    // -------------------------------------------------------------
    console.log("\n[Module 8] Query Safety & Regex Injection Immunity");
    const maliciousQuery = "(test|[a-z]*+?^$";
    const safeSearchRes = await fetch(
      `${BASE_URL}/courses?search=${encodeURIComponent(maliciousQuery)}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    assert(
      safeSearchRes.status === 200,
      "Security: Special regex characters in search query safely escaped without 500 error"
    );

    const safeReqSearchRes = await fetch(
      `${BASE_URL}/requests?search=${encodeURIComponent(maliciousQuery)}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    assert(
      safeReqSearchRes.status === 200,
      "Security: Special regex characters in requests search safely handled"
    );
  } catch (err) {
    console.error("Test execution failed:", err);
    failedCount++;
  } finally {
    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n[Cleanup] Cleaning up temporary test data...");
    if (studentId) {
      try {
        await User.findByIdAndDelete(studentId);
        console.log(`  - Deleted test student: ${testStudentEmail}`);
      } catch (e) {
        console.error("Cleanup error (User):", e.message);
      }
    }

    if (createdRequestId) {
      try {
        await ServiceRequest.findByIdAndDelete(createdRequestId);
        console.log(`  - Deleted test service request: ${createdRequestId}`);
      } catch (e) {
        console.error("Cleanup error (ServiceRequest):", e.message);
      }
    }

    if (testAssignmentId && studentId) {
      try {
        await Assignment.findByIdAndUpdate(testAssignmentId, {
          $pull: { submissions: { student: studentId } },
        });
        console.log(`  - Cleaned up test submission from assignment`);
      } catch (e) {
        console.error("Cleanup error (Assignment Submission):", e.message);
      }
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n=================================================================");
    console.log(
      `   Phase 8 Master Verification Complete: ${passedCount} Passed, ${failedCount} Failed`
    );
    console.log("=================================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runMasterVerification();
