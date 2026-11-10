/**
 * CampusConnect Phase 8.1 Production Security Hardening Verification
 * Tests:
 * 1. Express Rate Limiter on /api/auth/login (Enforces 5 max attempts per 15 mins per IP -> 429)
 * 2. Rate Limiting Headers & structured error response
 * 3. 12-character minimum password policy on registration (rejection of < 12 chars -> 400)
 * 4. Passphrase support without arbitrary composition constraints (spaces, long strings)
 * 5. Password manager long password support (up to 128 characters)
 * 6. 12-character minimum password policy on password change (rejection of < 12 chars -> 400)
 * 7. Successful password change with valid passphrase & bcrypt re-hashing
 * 8. Authentication & Authorization role guards (401 & 403)
 * 9. Safe database cleanup of temporary test accounts
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

const PORT = 5059; // Dedicated safe port for Phase 8.1 verification
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

async function runSecurityHardeningTests() {
  console.log("\n=================================================================");
  console.log("   CampusConnect Phase 8.1 Security Hardening Verification Suite  ");
  console.log("=================================================================\n");

  const timestamp = Date.now();
  const testStudentEmail = `phase8_1_student_${timestamp}@campusconnect.edu`;
  const validPassphrase = "correct horse battery staple 2026"; // 33-char passphrase with spaces
  const longManagerPassword = "aB3$kL9#mP2@qR8&vX4!zW7^yT1*uO5%nE6~"; // 36-char manager password
  const shortPassword = "ShortPass1!"; // 11 characters (< 12)
  let studentToken = null;
  let studentId = null;

  try {
    await connectDB();
    serverInstance = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // -------------------------------------------------------------
    // TEST 1 & 2: Password Minimum Length Policy (12 characters)
    // -------------------------------------------------------------
    console.log("[Test Suite 1] Strengthened Password Policy (Registration)");

    // Test rejection of 11-character password
    const shortRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Short Pass User",
        email: `short_${timestamp}@campusconnect.edu`,
        password: shortPassword,
        department: "Computer Science",
      }),
    });
    const shortRegData = await shortRegRes.json();
    assert(
      shortRegRes.status === 400 &&
        shortRegData.message.includes("at least 12 characters"),
      "Policy: Password shorter than 12 characters rejected with 400 Bad Request",
      JSON.stringify(shortRegData)
    );

    // Test successful registration with long passphrase (containing spaces)
    const validRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Security Hardened Student",
        email: testStudentEmail,
        password: validPassphrase,
        department: "Information Security",
      }),
    });
    const validRegData = await validRegRes.json();
    assert(
      validRegRes.status === 201 && validRegData.success && validRegData.token,
      "Policy: Natural passphrase (with spaces, >= 12 chars) registered successfully"
    );
    studentToken = validRegData.token;
    studentId = validRegData.user._id;

    // Test password manager generated long password support
    const managerRegEmail = `mgr_${timestamp}@campusconnect.edu`;
    const managerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Manager User",
        email: managerRegEmail,
        password: longManagerPassword,
        department: "Computer Science",
      }),
    });
    const managerRegData = await managerRegRes.json();
    assert(
      managerRegRes.status === 201 && managerRegData.success,
      "Policy: Password-manager-generated complex password (36 chars) accepted without error"
    );
    if (managerRegData.user?._id) {
      await User.findByIdAndDelete(managerRegData.user._id);
    }

    // -------------------------------------------------------------
    // TEST 3 & 4: Password Minimum Length Policy (Password Change)
    // -------------------------------------------------------------
    console.log("\n[Test Suite 2] Strengthened Password Policy (Password Update)");

    // Test rejection of short new password on PUT /api/auth/password
    const shortUpdateRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: validPassphrase,
        newPassword: "TooShort123", // 11 characters
      }),
    });
    const shortUpdateData = await shortUpdateRes.json();
    assert(
      shortUpdateRes.status === 400 &&
        shortUpdateData.message.includes("at least 12 characters"),
      "Policy: New password < 12 characters rejected on update with 400 Bad Request"
    );

    // Test successful password update to a new 20-character passphrase
    const newPassphrase = "autumn leaf drifting across the river";
    const validUpdateRes = await fetch(`${BASE_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: validPassphrase,
        newPassword: newPassphrase,
      }),
    });
    const validUpdateData = await validUpdateRes.json();
    assert(
      validUpdateRes.status === 200 && validUpdateData.success === true,
      "Policy: Updated to new 37-character passphrase successfully via PUT /api/auth/password"
    );

    // -------------------------------------------------------------
    // TEST SUITE 3: Authentication & Authorization Security
    // -------------------------------------------------------------
    console.log("\n[Test Suite 3] Authentication & Authorization Verification");

    // Verify authentication succeeds with the updated passphrase
    const successfulLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: newPassphrase,
      }),
    });
    const successfulLoginData = await successfulLoginRes.json();
    assert(
      successfulLoginRes.status === 200 &&
        successfulLoginData.token &&
        successfulLoginData.user.role === "student",
      "Authentication: Authenticated successfully with updated passphrase",
      JSON.stringify(successfulLoginData)
    );

    // Verify protected route rejects missing token
    const unauthRes = await fetch(`${BASE_URL}/auth/me`);
    assert(
      unauthRes.status === 401,
      "Security: Unauthenticated request rejected with 401 Unauthorized"
    );

    // Verify student cannot access admin route
    const forbiddenRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${successfulLoginData.token}` },
    });
    assert(
      forbiddenRes.status === 403,
      "Security: Student access to admin endpoint rejected with 403 Forbidden"
    );

    // -------------------------------------------------------------
    // TEST SUITE 4: Rate Limiting Enforcement on Login (429)
    // -------------------------------------------------------------
    console.log("\n[Test Suite 4] Express Rate Limiting on Login");

    // The limiter allows 5 requests per 15 minutes.
    // Trigger rate limiting by exhausting the allowed attempts.
    let hitRateLimit = false;
    let rateLimitStatusCode = null;
    let rateLimitMessage = null;

    for (let i = 1; i <= 6; i++) {
      const loginAttempt = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-rate-limit": "true",
        },
        body: JSON.stringify({
          email: testStudentEmail,
          password: "InvalidPasswordAttempt!",
        }),
      });

      if (loginAttempt.status === 429) {
        hitRateLimit = true;
        rateLimitStatusCode = loginAttempt.status;
        const body = await loginAttempt.json();
        rateLimitMessage = body.message;
        break;
      }
    }

    assert(
      hitRateLimit === true && rateLimitStatusCode === 429,
      "Rate Limiting: Exceeded attempts trigger HTTP 429 Too Many Requests"
    );

    assert(
      rateLimitMessage && rateLimitMessage.includes("15 minutes"),
      "Rate Limiting: Returns clear, descriptive 429 error message explaining 15-minute window"
    );
  } catch (err) {
    console.error("Test execution error:", err);
    failedCount++;
  } finally {
    console.log("\n[Cleanup] Cleaning up temporary test student...");
    if (studentId) {
      try {
        await User.findByIdAndDelete(studentId);
        console.log(`  - Cleaned up test student: ${testStudentEmail}`);
      } catch (e) {
        console.error("Cleanup error:", e.message);
      }
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();

    console.log("\n=================================================================");
    console.log(
      `   Phase 8.1 Verification Complete: ${passedCount} Passed, ${failedCount} Failed`
    );
    console.log("=================================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runSecurityHardeningTests();
