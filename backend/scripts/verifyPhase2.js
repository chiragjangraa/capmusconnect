/**
 * CampusConnect Phase 2 Integration Verification
 * Tests the authentication pipeline against the live backend server:
 * - Student Registration (POST /api/auth/register)
 * - Student Login (POST /api/auth/login)
 * - Admin Login (POST /api/auth/login with configured admin credentials)
 * - Token Verification (GET /api/auth/me)
 * - Negative Tests (duplicate registration, invalid password)
 * - Ensures no passwords or JWT tokens are printed
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

const PORT = 5056; // dedicated port for phase 2 verification
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

async function runPhase2Tests() {
  console.log("\n========================================================");
  console.log("   CampusConnect Phase 2 Authentication Verification");
  console.log("========================================================\n");

  const testStudentEmail = "phase2.student.verify@campusconnect.edu";
  const testStudentPassword = "StudentPass2026!";

  try {
    // 1. Connect database & start server
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Phase 2 verification server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // Cleanup any previous test run
    await User.deleteMany({ email: testStudentEmail });

    // ---------------------------------------------------------
    // TEST 1: Student Registration (POST /api/auth/register)
    // ---------------------------------------------------------
    console.log("[1] Student Registration Integration");
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aanya Gupta",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "Computer Science",
      }),
    });
    const regData = await regRes.json();

    assert(
      regRes.status === 201,
      "POST /api/auth/register returns HTTP 201 Created"
    );
    assert(
      regData.success === true && !!regData.token,
      "Registration returns success flag and JWT token"
    );
    assert(
      regData.user?.role === "student" && regData.user?.name === "Aanya Gupta",
      "Created account has role 'student' and correct profile fields"
    );
    const studentToken = regData.token;

    // ---------------------------------------------------------
    // TEST 2: Duplicate Registration Prevention
    // ---------------------------------------------------------
    console.log("\n[2] Registration Validation & Duplicate Prevention");
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aanya Duplicate",
        email: testStudentEmail,
        password: testStudentPassword,
        department: "IT",
      }),
    });
    const dupData = await dupRes.json();

    assert(
      dupRes.status === 400 && dupData.success === false,
      "Duplicate email registration is blocked with HTTP 400 Bad Request"
    );

    // ---------------------------------------------------------
    // TEST 3: Student Login (POST /api/auth/login)
    // ---------------------------------------------------------
    console.log("\n[3] Student Login Integration");
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
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
      "POST /api/auth/login returns HTTP 200 OK for student"
    );
    assert(
      studentLoginData.user?.role === "student",
      "Logged-in user role confirmed as 'student'"
    );

    // ---------------------------------------------------------
    // TEST 4: Admin Login (Configured Account)
    // ---------------------------------------------------------
    console.log("\n[4] Administrator Login Integration");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campusconnect.edu";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD not found in environment.");
    }

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
      adminLoginRes.status === 200,
      `POST /api/auth/login returns HTTP 200 OK for admin account (${adminEmail})`
    );
    assert(
      adminLoginData.user?.role === "admin",
      "Administrator user role confirmed as 'admin'"
    );
    const adminToken = adminLoginData.token;

    // ---------------------------------------------------------
    // TEST 5: Negative Login Test (Invalid Password)
    // ---------------------------------------------------------
    console.log("\n[5] Negative Login Authentication Test");
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: "IncorrectPassword123!",
      }),
    });
    assert(
      badLoginRes.status === 401,
      "Login with wrong password is rejected with HTTP 401 Unauthorized"
    );

    // ---------------------------------------------------------
    // TEST 6: Token Verification (GET /api/auth/me)
    // ---------------------------------------------------------
    console.log("\n[6] Token Verification (/api/auth/me)");
    const meResStudent = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meDataStudent = await meResStudent.json();
    assert(
      meResStudent.status === 200 && meDataStudent.user?.email === testStudentEmail,
      "GET /api/auth/me verifies student JWT and returns student profile"
    );

    const meResAdmin = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meDataAdmin = await meResAdmin.json();
    assert(
      meResAdmin.status === 200 && meDataAdmin.user?.role === "admin",
      "GET /api/auth/me verifies admin JWT and returns admin profile"
    );

    // ---------------------------------------------------------
    // Clean up
    // ---------------------------------------------------------
    console.log("\nCleaning up test records...");
    await User.deleteMany({ email: testStudentEmail });
    console.log("Cleanup complete.");

    // Summary
    console.log("\n========================================================");
    console.log(` Phase 2 Verification: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");

    if (failedCount > 0) process.exit(1);
  } catch (error) {
    console.error("Phase 2 test failed with error:", error.message);
    process.exit(1);
  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  }
}

runPhase2Tests();
