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

const connectDB = require("../config/db");
const Assignment = require("../models/Assignment");

const standardAssignments = [
  {
    title: "B-Tree Indexing Implementation",
    courseCode: "CS304",
    courseName: "Database Management Systems",
    instructor: "Prof. Marcus Thorne",
    dueDate: "Nov 10, 2026, 11:59 PM",
    priority: "high",
    points: "100 pts",
    type: "Programming Lab",
    description:
      "Implement a disk-backed B+ tree index structure in C++/Java supporting search, insertion, and node splitting under concurrent read locks.",
  },
  {
    title: "Distributed TCP Socket Protocol Lab",
    courseCode: "CS308",
    courseName: "Computer Networks & Security",
    instructor: "Dr. Sarah Jenkins",
    dueDate: "Nov 12, 2026, 05:00 PM",
    priority: "medium",
    points: "50 pts",
    type: "Socket Lab",
    description:
      "Build a multi-client chat server using raw POSIX TCP sockets with message broadcast, client disconnections, and thread synchronization.",
  },
  {
    title: "Next.js Authentication Sprint",
    courseCode: "CS312",
    courseName: "Web & Cloud Architecture",
    instructor: "Prof. David Vance",
    dueDate: "Nov 14, 2026, 11:59 PM",
    priority: "medium",
    points: "75 pts",
    type: "Project Milestone",
    description:
      "Integrate session cookies, JWT verification, and protected server-side layouts using Next.js App Router route middleware.",
  },
  {
    title: "Round-Robin CPU Scheduler Simulator",
    courseCode: "CS315",
    courseName: "Operating Systems Lab",
    instructor: "Dr. Jonathan Hayes",
    dueDate: "Nov 17, 2026, 11:59 PM",
    priority: "low",
    points: "100 pts",
    type: "Algorithm Simulator",
    description:
      "Construct a C simulation calculating average waiting time and turnaround time for Round Robin, SRTF, and Priority Scheduling.",
  },
  {
    title: "Fibonacci Heap Amortized Runtime Benchmark",
    courseCode: "CS301",
    courseName: "Advanced Data Structures & Algorithms",
    instructor: "Dr. Evelyn Reed",
    dueDate: "Nov 20, 2026, 11:59 PM",
    priority: "medium",
    points: "100 pts",
    type: "Empirical Analysis",
    description:
      "Empirically compare Fibonacci Heap decrease-key latency against Binary Heap on random dense graph instances of Dijkstra algorithm.",
  },
  {
    title: "Wireshark TLS Packet Interception Lab",
    courseCode: "CS308",
    courseName: "Computer Networks & Security",
    instructor: "Dr. Sarah Jenkins",
    dueDate: "Nov 26, 2026, 05:00 PM",
    priority: "low",
    points: "60 pts",
    type: "Network Capture Lab",
    description:
      "Analyze pre-master secret key exchanges and TLS 1.3 ClientHello, ServerHello, and certificate negotiation frames using Wireshark captures.",
  },
  {
    title: "Dijkstra Routing Simulation",
    courseCode: "CS308",
    courseName: "Computer Networks & Security",
    instructor: "Dr. Sarah Jenkins",
    dueDate: "Nov 8, 2026, 11:59 PM",
    priority: "medium",
    points: "50 pts",
    type: "Programming Lab",
    description:
      "Simulate link-state packet dissemination and OSPF routing table calculation over a 16-node synthetic network topology.",
  },
  {
    title: "SQL Normalization & 3NF Quiz",
    courseCode: "CS304",
    courseName: "Database Management Systems",
    instructor: "Prof. Marcus Thorne",
    dueDate: "Nov 5, 2026, 11:59 PM",
    priority: "high",
    points: "100 pts",
    type: "Theoretical Assessment",
    description:
      "Formal decomposition of relational schemas into BCNF and 3NF ensuring dependency preservation and lossless joins.",
  },
  {
    title: "Multi-threaded Web Crawler with Mutexes",
    courseCode: "CS315",
    courseName: "Operating Systems Lab",
    instructor: "Dr. Jonathan Hayes",
    dueDate: "Oct 31, 2026, 11:59 PM",
    priority: "medium",
    points: "100 pts",
    type: "Lab Assignment",
    description:
      "Thread-safe URL frontier with POSIX condition variables and worker thread pool preventing deadlock cycles.",
  },
  {
    title: "Server-Side Rendered Blog with Markdown",
    courseCode: "CS312",
    courseName: "Web & Cloud Architecture",
    instructor: "Prof. David Vance",
    dueDate: "Oct 29, 2026, 11:59 PM",
    priority: "medium",
    points: "75 pts",
    type: "Web Project",
    description:
      "Build a static-first Next.js blog engine with incremental static regeneration, dynamic markdown parsing, and syntax-highlighted code fences.",
  },
];

async function seedAssignments() {
  try {
    console.log("[Seed] Connecting to MongoDB Atlas...");
    await connectDB();

    console.log("[Seed] Upserting curriculum assignments...");
    let count = 0;

    for (const asgn of standardAssignments) {
      await Assignment.findOneAndUpdate(
        { title: asgn.title, courseCode: asgn.courseCode },
        { $set: asgn },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      count++;
    }

    console.log(`[Seed] Successfully seeded ${count} assignments into MongoDB Atlas.`);
  } catch (error) {
    console.error("[Seed] Error seeding assignments:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("[Seed] Database connection closed.");
  }
}

if (require.main === module) {
  seedAssignments();
}

module.exports = { standardAssignments, seedAssignments };
