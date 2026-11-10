const path = require("path");
const fs = require("fs");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Configure public DNS fallback to prevent Windows Node.js querySrv ECONNREFUSED issue
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // continue with default resolver
}

// 1. Explicitly load backend/.env using absolute path
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const testDatabaseConnection = async () => {
  console.log("\n========================================================");
  console.log("   CampusConnect - MongoDB Connection Test");
  console.log("========================================================\n");

  // 2. Check for duplicate MONGODB_URI entries in backend/.env
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const matches = envContent.match(/^\s*MONGODB_URI\s*=/gm);
    if (matches && matches.length > 1) {
      console.warn(
        `⚠️ Warning: Found ${matches.length} duplicate 'MONGODB_URI' entries in backend/.env.`
      );
      console.warn("👉 Please ensure only one MONGODB_URI definition exists in backend/.env.\n");
    }
  }

  // 3. Read only the value from process.env.MONGODB_URI
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  // 4. Sanitize: strip any redundant "MONGODB_URI=" prefix, quotes, and whitespace
  uri = uri.trim();
  if (uri.startsWith("MONGODB_URI=")) {
    uri = uri.slice("MONGODB_URI=".length).trim();
  }

  // Strip wrapping single or double quotes
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }

  // 5. Placeholder detection
  if (
    uri.includes("PASTE_YOUR_MONGODB_ATLAS_CONNECTION_STRING_HERE") ||
    uri.includes("<password>") ||
    uri.includes("<username>")
  ) {
    console.error(
      "⚠️ Warning: MONGODB_URI still contains placeholders (<password>, <username>, or PASTE_YOUR...)."
    );
    console.error(
      "👉 Please replace <username> and <password> with your actual MongoDB Atlas database credentials.\n"
    );
    process.exit(1);
  }

  // 6. Validate scheme
  const hasValidScheme =
    uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
  if (!hasValidScheme) {
    console.error(
      "❌ Invalid scheme: Connection string must start with 'mongodb://' or 'mongodb+srv://'."
    );
    console.error(
      `   Received scheme starts with: '${uri.slice(0, 15)}...'`
    );
    process.exit(1);
  }

  // 7. Security: never print credentials. Obfuscate completely.
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  console.log(`Connecting securely to cluster: ${maskedUri.split("?")[0]}...`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("\n✅ SUCCESS: Successfully connected to MongoDB Atlas!");
    console.log(`   Cluster Host : ${conn.connection.host}`);
    console.log(`   Database Name: ${conn.connection.name}`);
    console.log(
      `   Status       : ${
        conn.connection.readyState === 1 ? "Connected (1)" : conn.connection.readyState
      }`
    );
    console.log("========================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ FAILED: Could not connect to MongoDB Atlas.");
    console.error(`   Error: ${error.message}\n`);
    console.error("Troubleshooting checklist:");
    console.error("1. Username & Password: Verify username and password in backend/.env.");
    console.error("2. Special Characters: If password has characters like @, #, $, URL-encode them.");
    console.error("3. Atlas IP Whitelist: Go to Atlas > Network Access, verify 0.0.0.0/0 is Active.");
    console.error("4. Internet / Firewall: Ensure outgoing port 27017 / SSL is not blocked.\n");

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

testDatabaseConnection();
