/**
 * CampusConnect Phase 7 Settings Module Integration Verification
 * Verifies live database integration and security for Settings & Profile updates:
 * - Unauthenticated access rejection (401 Unauthorized) for PUT /api/auth/profile and PUT /api/auth/password
 * - Student authentication and profile details retrieval
 * - Profile updating (name, department) via PUT /api/auth/profile
 * - Verification of database persistence in MongoDB Atlas via GET /api/auth/me
 * - Privilege escalation prevention: Attempting { role: 'admin' } in PUT /api/auth/profile is strictly ignored
 * - Validation handling for empty/invalid name and department
 * - Password update verification: rejection of incorrect current password (401)
 * - Password update validation: rejection of short new passwords (< 6 chars)
 * - Successful password update and bcrypt re-hashing
 * - Authentication verification: old password rejected, new password accepted
 * - Account isolation: authenticated user can only update their own record (req.user._id)
 * - Admin profile update and role retention
 * - Full cleanup of temporary test records from MongoDB Atlas
 */

const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Configure public DNS fallback for Windows querySrv resolution
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

const PORT = 5054; // Safe dedicated port for Phase 7 verification
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

async function runPhase7Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 7 Settings Module Verification   ");
  console.log("========================================================\n");

  const testEmail = `phase7_test_user_${Date.now()}@campusconnect.edu`;
  const initialPassword = "InitialPassword123!";
  const updatedPassword = "UpdatedSecurePassword456!";
  let studentToken = null;
  let studentId = null;

  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start test server
    serverInstance = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // TEST 1: Unauthenticated PUT /api/auth/profile returns 401
    const unauthProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauth Name" }),
    });
    assert(
      unauthProfileRes.status === 401,
      "Security: Unauthenticated PUT /api/auth/profile blocked with 401"
    );

    // TEST 2: Unauthenticated PUT /api/auth/password returns 401
    const unauthPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "any",
        newPassword: "new",
      }),
    });
    assert(
      unauthPasswordRes.status === 401,
      "Security: Unauthenticated PUT /api/auth/password blocked with 401"
    );

    // TEST 3: Register test student
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase 7 Student",
        email: testEmail,
        password: initialPassword,
        department: "Mechanical Engineering",
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success && regData.token,
      "Setup: Registered test student successfully",
      JSON.stringify(regData)
    );
    studentToken = regData.token;
    studentId = regData.user._id;

    // TEST 4: Student updates profile name and department
    const updateProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        name: "Jane Student Updated",
        department: "Robotics & Automation",
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(
      updateProfileRes.status === 200 &&
        updateProfileData.success === true &&
        updateProfileData.user.name === "Jane Student Updated" &&
        updateProfileData.user.department === "Robotics & Automation",
      "Profile: Updated name and department successfully via PUT /api/auth/profile",
      JSON.stringify(updateProfileData)
    );

    // TEST 5: Verify MongoDB persistence via GET /api/auth/me
    const getMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const getMeData = await getMeRes.json();
    assert(
      getMeRes.status === 200 &&
        getMeData.user.name === "Jane Student Updated" &&
        getMeData.user.department === "Robotics & Automation",
      "Persistence: Verified profile updates persisted in MongoDB Atlas via GET /api/auth/me"
    );

    // TEST 6: Privilege escalation prevention - user cannot escalate role
    const escalateRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        role: "admin",
        name: "Jane Student",
      }),
    });
    const escalateData = await escalateRes.json();
    const dbCheckUser = await User.findById(studentId);
    assert(
      escalateData.user.role === "student" && dbCheckUser.role === "student",
      "Security: Privilege escalation blocked; role remains 'student' when body includes role: 'admin'"
    );

    // TEST 7: Validation error on empty name
    const emptyNameRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        name: "   ",
      }),
    });
    assert(
      emptyNameRes.status === 400,
      "Validation: Rejected empty name with 400 Bad Request"
    );

    // TEST 8: Validation error on empty department
    const emptyDeptRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        department: "   ",
      }),
    });
    assert(
      emptyDeptRes.status === 400,
      "Validation: Rejected empty department with 400 Bad Request"
    );

    // TEST 9: Password update fails with incorrect current password
    const wrongPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: "IncorrectOldPassword999!",
        newPassword: updatedPassword,
      }),
    });
    assert(
      wrongPasswordRes.status === 401,
      "Security: Rejected password update with incorrect current password (401)"
    );

    // TEST 10: Password update fails with short new password (< 6 chars)
    const shortPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: "12345",
      }),
    });
    assert(
      shortPasswordRes.status === 400,
      "Validation: Rejected new password shorter than 6 characters (400)"
    );

    // TEST 11: Successful password update with correct credentials
    const validPasswordRes = await fetch(`${BASE_URL}/auth/password`, {
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
    const validPasswordData = await validPasswordRes.json();
    assert(
      validPasswordRes.status === 200 && validPasswordData.success === true,
      "Password: Password updated and securely re-hashed via PUT /api/auth/password"
    );

    // TEST 12: Old password no longer authenticates
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    assert(
      oldLoginRes.status === 401,
      "Authentication: Old password properly invalidated after update"
    );

    // TEST 13: New password authenticates successfully
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword,
      }),
    });
    const newLoginData = await newLoginRes.json();
    assert(
      newLoginRes.status === 200 && newLoginData.success && newLoginData.token,
      "Authentication: Successfully authenticated with updated new password"
    );

    // TEST 14: Account isolation - Student cannot update other users via ID injection
    const secondUserEmail = `phase7_second_${Date.now()}@campusconnect.edu`;
    const secondUser = await User.create({
      name: "Second User Unaffected",
      email: secondUserEmail,
      password: "SamplePassword123!",
      department: "Mathematics",
      role: "student",
    });

    const spoofAttemptRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newLoginData.token}`,
      },
      body: JSON.stringify({
        _id: secondUser._id.toString(),
        id: secondUser._id.toString(),
        name: "Attempted Spoof Name",
      }),
    });
    assert(
      spoofAttemptRes.status === 200,
      "Account Isolation: Request processed strictly for authenticated token owner"
    );

    const secondUserCheck = await User.findById(secondUser._id);
    assert(
      secondUserCheck.name === "Second User Unaffected",
      "Account Isolation: Other user records remained completely unaffected by spoof attempt"
    );

    // TEST 15: Admin account profile update & role preservation
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
      if (adminLoginRes.status === 200 && adminLoginData.token) {
        const originalAdminName = adminLoginData.user.name;
        const originalAdminDept = adminLoginData.user.department;

        const updateAdminRes = await fetch(`${BASE_URL}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminLoginData.token}`,
          },
          body: JSON.stringify({
            name: `${originalAdminName}`,
            department: `${originalAdminDept}`,
          }),
        });
        const updateAdminData = await updateAdminRes.json();
        assert(
          updateAdminRes.status === 200 &&
            updateAdminData.user.role === "admin",
          "Admin: Verified administrator profile updates succeed and role remains 'admin'"
        );
      }
    }

    // Cleanup second user
    await User.findByIdAndDelete(secondUser._id);
  } catch (err) {
    console.error("Test execution failed:", err);
    failedCount++;
  } finally {
    // Cleanup test student
    if (studentId) {
      try {
        await User.findByIdAndDelete(studentId);
        console.log(`\nCleaned up test student: ${testEmail}`);
      } catch (e) {
        console.error("Cleanup error:", e.message);
      }
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n========================================================");
    console.log(
      `   Phase 7 Verification Complete: ${passedCount} Passed, ${failedCount} Failed`
    );
    console.log("========================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase7Tests();
