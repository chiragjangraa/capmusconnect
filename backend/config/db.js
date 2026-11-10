const dns = require("dns");
const mongoose = require("mongoose");

// Fallback to public DNS to resolve Windows Node.js querySrv ECONNREFUSED issues
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // continue with default resolver
}

const connectDB = async () => {
  try {
    let mongoURI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusconnect";

    // Clean URI if malformed with prefix or quotes
    if (typeof mongoURI === "string") {
      mongoURI = mongoURI.trim();
      if (mongoURI.startsWith("MONGODB_URI=")) {
        mongoURI = mongoURI.slice("MONGODB_URI=".length).trim();
      }
      if (
        (mongoURI.startsWith('"') && mongoURI.endsWith('"')) ||
        (mongoURI.startsWith("'") && mongoURI.endsWith("'"))
      ) {
        mongoURI = mongoURI.slice(1, -1).trim();
      }
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(
      `[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
