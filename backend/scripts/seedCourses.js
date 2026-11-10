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
const Course = require("../models/Course");

const standardCourses = [
  {
    code: "CS301",
    title: "Advanced Data Structures & Algorithms",
    department: "Computer Science & Engineering",
    category: "Core Engineering",
    credits: 4,
    progress: 78,
    schedule: "Mon, Wed • 09:00 - 10:30 AM",
    room: "Tech Hall 204",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Comprehensive investigation of self-balancing search trees, network flow, Fibonacci heaps, dynamic programming amortized analysis, and NP-hard problem approximations.",
    faculty: {
      name: "Dr. Evelyn Reed",
      role: "Associate Professor & Algorithms Lab Lead",
      department: "School of Computing",
      email: "e.reed@campusconnect.edu",
      office: "Computing Complex Room 412",
      officeHours: "Tue, Thu • 02:00 - 04:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Balanced Search Trees & B-Trees",
        description:
          "AVL balancing, Red-Black tree properties and rotations, disk indexing B-Trees and 2-3-4 trees.",
        status: "Completed",
      },
      {
        week: "Weeks 4-6",
        title: "Graph Algorithms & Shortest Paths",
        description:
          "Dijkstra algorithm, Bellman-Ford, Floyd-Warshall, and Ford-Fulkerson maximum network flow.",
        status: "Completed",
      },
      {
        week: "Weeks 7-9",
        title: "Disjoint Sets & Advanced Dynamic Programming",
        description:
          "Union-Find with path compression, matrix chain multiplication, traveling salesperson subproblems.",
        status: "Completed",
      },
      {
        week: "Weeks 10-12",
        title: "Amortized Analysis & Fibonacci Heaps",
        description:
          "Aggregate and potential methods, binomial heaps, Fibonacci heap structural invariants and decrease-key.",
        status: "In Progress",
      },
      {
        week: "Weeks 13-15",
        title: "NP-Completeness & Approximation Schemes",
        description:
          "Turing reductions, 3-SAT to Vertex Cover transformations, polynomial time approximation schemes.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "CS304",
    title: "Database Management Systems",
    department: "Computer Science & Engineering",
    category: "Core Engineering",
    credits: 4,
    progress: 65,
    schedule: "Tue, Thu • 11:00 - 12:30 PM",
    room: "CS Lab 1",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Foundational theory of relational data models, SQL optimization engines, normal forms up to BCNF, ACID transactions, two-phase locking, and distributed key-value stores.",
    faculty: {
      name: "Prof. Marcus Thorne",
      role: "Professor of Database Systems",
      department: "School of Computing",
      email: "m.thorne@campusconnect.edu",
      office: "Faculty Block B, Room 204",
      officeHours: "Mon, Wed • 03:00 - 05:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Relational Algebra & Schema Normalization",
        description:
          "Tuple relational calculus, functional dependencies, 1NF through BCNF lossless join decompositions.",
        status: "Completed",
      },
      {
        week: "Weeks 4-7",
        title: "Query Optimization & Execution Engines",
        description:
          "Cost estimation heuristics, hash joins, external merge sorting, index-nested loop join strategies.",
        status: "Completed",
      },
      {
        week: "Weeks 8-10",
        title: "ACID Transactions & Concurrency Protocols",
        description:
          "Serializability graph checks, Two-Phase Locking (2PL), deadlocks, Write-Ahead Logging (ARIES).",
        status: "In Progress",
      },
      {
        week: "Weeks 11-13",
        title: "B+ Tree Indexing & Buffer Management",
        description:
          "Buffer pool replacement policies (LRU, CLOCK), dense vs sparse indices, multidimensional spatial indexing.",
        status: "Upcoming",
      },
      {
        week: "Weeks 14-15",
        title: "NoSQL & Distributed Stores",
        description:
          "CAP theorem, document-oriented storage, consistent hashing, replica synchronization.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "CS308",
    title: "Computer Networks & Security",
    department: "Computer Science & Engineering",
    category: "Core Engineering",
    credits: 3,
    progress: 72,
    schedule: "Mon, Wed • 02:00 - 03:30 PM",
    room: "Network Lab 3",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Deep dive into the 5-layer Internet architecture, TCP congestion control algorithms (Reno, Cubic), IP routing protocols (BGP, OSPF), DNS, and public key TLS infrastructure.",
    faculty: {
      name: "Dr. Sarah Jenkins",
      role: "Associate Professor of Network Systems",
      department: "School of Computing",
      email: "s.jenkins@campusconnect.edu",
      office: "Cybersec Tower Room 501",
      officeHours: "Fri • 10:00 - 12:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Layered Architectures & Socket Programming",
        description:
          "Client-server paradigm, UDP vs TCP sockets, packet switching vs circuit switching fundamentals.",
        status: "Completed",
      },
      {
        week: "Weeks 4-7",
        title: "Transport Protocols & Congestion Control",
        description:
          "Reliable data transfer protocols, TCP handshake, sliding windows, AIMD congestion avoidance.",
        status: "Completed",
      },
      {
        week: "Weeks 8-10",
        title: "Network Layer & Internet Routing",
        description:
          "IPv4/IPv6 subnetting, CIDR, distance-vector routing, link-state protocols, autonomous systems.",
        status: "In Progress",
      },
      {
        week: "Weeks 11-13",
        title: "Link Layer & Ethernet Switching",
        description:
          "Error detection (CRC), CSMA/CD, MAC address learning, spanning tree protocol.",
        status: "Upcoming",
      },
      {
        week: "Weeks 14-15",
        title: "Applied Cryptography & TLS Handshake",
        description:
          "Diffie-Hellman key exchange, RSA encryption, HMAC integrity, X.509 certificate chains.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "CS312",
    title: "Web & Cloud Architecture",
    department: "Computer Science & Engineering",
    category: "Elective / Specialization",
    credits: 4,
    progress: 84,
    schedule: "Fri • 09:00 - 12:00 PM",
    room: "Software Suite A",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Modern full-stack web architectures, Next.js server and client rendering pipelines, REST and GraphQL APIs, microservices container orchestration, and serverless computing.",
    faculty: {
      name: "Prof. David Vance",
      role: "Chair of Web & Cloud Computing",
      department: "School of Computing",
      email: "d.vance@campusconnect.edu",
      office: "Software Building Room 310",
      officeHours: "Wed • 01:00 - 03:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Modern JavaScript & React Concurrency",
        description:
          "ES6+ module mechanics, asynchronous JavaScript, React Server Components (RSC) hydration models.",
        status: "Completed",
      },
      {
        week: "Weeks 4-7",
        title: "Next.js App Router Architecture",
        description:
          "Layout hierarchy, route handlers, server actions, streaming Suspense, Turbopack bundling.",
        status: "Completed",
      },
      {
        week: "Weeks 8-10",
        title: "Authentication, RBAC & Cloud Databases",
        description:
          "JWT tokens, OAuth2 flows, Prisma/PostgreSQL integrations, redis session caching layers.",
        status: "In Progress",
      },
      {
        week: "Weeks 11-13",
        title: "Containerization & Docker Orchestration",
        description:
          "Multi-stage Docker builds, Kubernetes pods, ingress controllers, CI/CD automated deployments.",
        status: "Upcoming",
      },
      {
        week: "Weeks 14-15",
        title: "Edge Computing & CDN Architectures",
        description:
          "Cloudflare workers, edge middleware, global cache invalidation protocols, web performance budgets.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "MA302",
    title: "Probability, Statistics & Linear Algebra",
    department: "Mathematics & Sciences",
    category: "Allied Mathematics",
    credits: 3,
    progress: 60,
    schedule: "Tue, Thu • 09:00 - 10:30 AM",
    room: "Science Hall 105",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Calculus-based probability theory, random variable transformations, covariance matrices, singular value decomposition (SVD), and principal component analysis (PCA).",
    faculty: {
      name: "Dr. Katherine Price",
      role: "Professor of Applied Mathematics",
      department: "Department of Mathematics",
      email: "k.price@campusconnect.edu",
      office: "Math Building Room 114",
      officeHours: "Mon • 02:00 - 04:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Probability Spaces & Bayes Theorem",
        description:
          "Conditional probabilities, law of total probability, random variables and probability mass functions.",
        status: "Completed",
      },
      {
        week: "Weeks 4-7",
        title: "Continuous Distributions & Central Limit Theorem",
        description:
          "Normal, Poisson, exponential distributions, Chebyshev inequality, law of large numbers.",
        status: "Completed",
      },
      {
        week: "Weeks 8-10",
        title: "Matrix Decompositions & Eigenvalues",
        description:
          "Spectral theorem, orthogonal matrices, QR factorization, Singular Value Decomposition (SVD).",
        status: "In Progress",
      },
      {
        week: "Weeks 11-13",
        title: "Dimensionality Reduction (PCA)",
        description:
          "Covariance derivation, projection onto principal components, variance preservation analysis.",
        status: "Upcoming",
      },
      {
        week: "Weeks 14-15",
        title: "Hypothesis Testing & Regression Models",
        description:
          "Null hypothesis significance testing, p-values, t-distribution, ordinary least squares linear regression.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "CS315",
    title: "Operating Systems & Concurrency Lab",
    department: "Computer Science & Engineering",
    category: "Laboratory Course",
    credits: 2,
    progress: 70,
    schedule: "Thu • 02:00 - 05:00 PM",
    room: "Systems Lab 2",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Hands-on implementation of operating systems primitives: process management, CPU scheduling, POSIX threads, semaphores, mutexes, and virtual memory page fault handlers.",
    faculty: {
      name: "Dr. Jonathan Hayes",
      role: "Senior Systems Lecturer",
      department: "School of Computing",
      email: "j.hayes@campusconnect.edu",
      office: "Hardware Center Room 102",
      officeHours: "Wed, Thu • 11:00 - 01:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Unix Process Lifecycle & Fork",
        description:
          "Fork/exec syscalls, process trees, zombie/orphan cleanup, inter-process communication pipes.",
        status: "Completed",
      },
      {
        week: "Weeks 4-6",
        title: "CPU Scheduling Simulators",
        description:
          "FIFO, Round Robin with quantum evaluation, Shortest Remaining Time First (SRTF) simulation.",
        status: "Completed",
      },
      {
        week: "Weeks 7-9",
        title: "Pthreads & Mutual Exclusion",
        description:
          "Race condition analysis, Peterson algorithm, mutex locks, condition variables.",
        status: "Completed",
      },
      {
        week: "Weeks 10-12",
        title: "Producer-Consumer & Dining Philosophers",
        description:
          "Counting semaphores, deadlock avoidance (Banker algorithm), resource allocation graphs.",
        status: "In Progress",
      },
      {
        week: "Weeks 13-15",
        title: "Virtual Memory Page Replacement",
        description:
          "Paging simulation, FIFO, LRU, Second-Chance page replacement policies.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "DS301",
    title: "Deep Learning & Neural Architectures",
    department: "Data Science & AI",
    category: "Elective / Specialization",
    credits: 4,
    progress: 68,
    schedule: "Mon, Wed • 10:30 - 12:00 PM",
    room: "AI Center Room 303",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Mathematical principles of deep learning: gradient backpropagation, CNNs for computer vision, RNNs, Transformer self-attention architectures, and generative adversarial models.",
    faculty: {
      name: "Dr. Raymond Ng",
      role: "Director of AI Research",
      department: "Department of Data Science",
      email: "r.ng@campusconnect.edu",
      office: "AI Complex Room 601",
      officeHours: "Tue • 01:00 - 03:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "Perceptrons & Multilayer Networks",
        description:
          "Activation functions, cross-entropy loss, stochastic gradient descent, Adam optimizer.",
        status: "Completed",
      },
      {
        week: "Weeks 4-7",
        title: "Convolutional Neural Networks (CNNs)",
        description:
          "Convolution layers, pooling, ResNet skip connections, transfer learning on ImageNet.",
        status: "Completed",
      },
      {
        week: "Weeks 8-10",
        title: "Transformer Attention Models",
        description:
          "Query, Key, Value attention mechanisms, positional encodings, multi-head attention.",
        status: "In Progress",
      },
      {
        week: "Weeks 11-13",
        title: "Generative Models & VAEs",
        description:
          "Variational autoencoders, latent space manifolds, diffusion model foundations.",
        status: "Upcoming",
      },
      {
        week: "Weeks 14-15",
        title: "Model Quantization & Efficient Inference",
        description:
          "Pruning, FP16/INT8 quantization, ONNX runtime deployment architectures.",
        status: "Upcoming",
      },
    ],
  },
  {
    code: "EC305",
    title: "Microprocessors & Embedded Systems",
    department: "Electronics & Communication",
    category: "Interdisciplinary Elective",
    credits: 3,
    progress: 62,
    schedule: "Tue, Thu • 10:00 - 11:30 AM",
    room: "Robotics Lab Room 108",
    semester: "Semester 5 (Fall 2026)",
    description:
      "Architecture of ARM Cortex-M microcontrollers, assembly and embedded C interfacing, interrupt service routines, timers, pulse-width modulation, and serial communications.",
    faculty: {
      name: "Prof. Arthur Pendelton",
      role: "Professor of Embedded Systems",
      department: "School of Electronics",
      email: "a.pendelton@campusconnect.edu",
      office: "ECE Hall Room 215",
      officeHours: "Wed • 02:00 - 04:00 PM",
    },
    syllabus: [
      {
        week: "Weeks 1-3",
        title: "ARM Cortex Architecture & Assembly",
        description:
          "Register set, pipeline execution, memory mapping, instruction encoding and debugging.",
        status: "Completed",
      },
      {
        week: "Weeks 4-6",
        title: "GPIO & Timer Peripherals",
        description:
          "Direct register configuration, push-pull outputs, timer prescalers, hardware PWM generation.",
        status: "Completed",
      },
      {
        week: "Weeks 7-9",
        title: "Interrupt Controllers & NVIC",
        description:
          "Nested vector interrupt controller, ISR priorities, tail-chaining latency analysis.",
        status: "Completed",
      },
      {
        week: "Weeks 10-12",
        title: "Serial Protocols (UART, SPI, I2C)",
        description:
          "Baud rate generation, clock polarity/phase, master-slave addressing, DMA buffer transfers.",
        status: "In Progress",
      },
      {
        week: "Weeks 13-15",
        title: "Real-Time Operating Systems (FreeRTOS)",
        description:
          "Task priorities, preemptive scheduling, semaphores, queues, and task notifications.",
        status: "Upcoming",
      },
    ],
  },
];

async function seedCourses() {
  try {
    console.log("[Seed] Connecting to MongoDB Atlas...");
    await connectDB();

    console.log("[Seed] Upserting standard university courses...");
    let seededCount = 0;

    for (const c of standardCourses) {
      await Course.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      seededCount++;
    }

    console.log(`[Seed] Successfully seeded ${seededCount} courses into MongoDB Atlas.`);
  } catch (error) {
    console.error("[Seed] Error seeding courses:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("[Seed] Database connection closed.");
  }
}

if (require.main === module) {
  seedCourses();
}

module.exports = { standardCourses, seedCourses };
