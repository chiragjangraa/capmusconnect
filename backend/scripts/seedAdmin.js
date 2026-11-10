const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load backend .env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.ADMIN_NAME || "System Administrator";
    const email = (
      process.env.ADMIN_EMAIL || "admin@campusconnect.edu"
    ).toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "AdminPass2026!";
    const department =
      process.env.ADMIN_DEPARTMENT || "Administrative Services";

    console.log(`Checking for existing admin user: ${email}...`);

    let admin = await User.findOne({ email });

    if (admin) {
      console.log(`Admin account '${email}' already exists (ID: ${admin._id}).`);
      // Ensure role is admin
      if (admin.role !== "admin") {
        admin.role = "admin";
        await admin.save();
        console.log(`Updated user role to 'admin'.`);
      }
    } else {
      admin = await User.create({
        name,
        email,
        password,
        role: "admin",
        department,
      });

      console.log(`===============================================`);
      console.log(` Initial Admin Account Successfully Created!`);
      console.log(` ID         : ${admin._id}`);
      console.log(` Name       : ${admin.name}`);
      console.log(` Email      : ${admin.email}`);
      console.log(` Role       : ${admin.role}`);
      console.log(` Department : ${admin.department}`);
      console.log(`===============================================`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin user:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
