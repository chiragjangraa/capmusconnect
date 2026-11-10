# CampusConnect Backend API

Robust, secure backend REST API for the **CampusConnect Student Management Portal** developed as part of the *Full Stack Development-II Lab Assessment*.

Built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **JWT (JSON Web Tokens)**, and **bcryptjs**.

---

## Architecture Overview

```
backend/
├── config/
│   └── db.js                 # MongoDB connection using Mongoose
├── controllers/
│   ├── authController.js     # Student registration & login, JWT creation
│   ├── requestController.js  # Service request CRUD (Student scoped, Pending-only edit/delete)
│   └── adminController.js    # Status transitions, staff assignment, dashboard aggregation
├── middleware/
│   ├── authMiddleware.js     # JWT Bearer token authentication & user context injection
│   ├── roleMiddleware.js     # Role-based authorization ('student', 'admin')
│   └── errorMiddleware.js    # Centralized error handling & 404 response
├── models/
│   ├── User.js               # User schema with bcrypt pre-save hash & matchPassword
│   └── ServiceRequest.js     # Service request schema with indexes & references
├── routes/
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── requestRoutes.js      # /api/requests endpoints
│   └── adminRoutes.js        # /api/admin endpoints
├── scripts/
│   └── seedAdmin.js          # Secure administrator account seeding script
├── tests/
│   └── verifyBackend.js      # 40-assertion end-to-end integration test suite
├── utils/
│   └── statusWorkflow.js     # Finite state machine enforcing exact status workflow
├── .env.example              # Environment variable template
├── .gitignore                # Git exclusions (node_modules, .env)
├── package.json              # Backend dependencies & npm scripts
└── server.js                 # Express application entrypoint
```

---

## Key Features & Security Implementation

1. **Role-Based Privilege Escalation Prevention**:
   - `POST /api/auth/register` strictly creates `student` accounts. Any attempt to supply `role: "admin"` in the payload is ignored.
   - Initial administrative accounts are securely provisioned via the `seedAdmin.js` CLI script reading trusted environment credentials.

2. **Strict Status Workflow State Machine**:
   - Requests progress in an exact assessment-compliant lifecycle:
     $$\text{Pending} \longrightarrow \text{Under Review} \longrightarrow \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved} \longrightarrow \text{Closed}$$
   - `Rejected` is only permitted from appropriate initial stages (`Pending` and `Under Review`).
   - Terminal stages (`Closed`, `Rejected`) reject any subsequent status transitions with `400 Bad Request`.

3. **Assignment Validation**:
   - Assigning requests (`PUT /api/requests/:id/assign`) verifies that the assigned ID exists in the database and has `role === 'admin'`. Attempting to assign a ticket to a student is blocked with `400 Bad Request`.
   - Assigning a request automatically advances an `Under Review` request to `Assigned`.

4. **Student Edit & Delete Lock**:
   - Students may only view and manage their own service requests.
   - Updating or deleting a request is permitted **only while `status === 'Pending'`**. Once an admin moves a request to `Under Review` or beyond, modifications and deletions are strictly forbidden.

5. **MongoDB Aggregation Pipeline**:
   - `GET /api/admin/dashboard` uses a high-performance `$facet` pipeline to compute summary counts (`totalRequests`, `pendingCount`, `underReviewCount`, `assignedCount`, `inProgressCount`, `resolvedCount`, `closedCount`, `rejectedCount`, `highPriorityCount`), registered student and admin totals, status breakdowns, priority breakdowns, and category distributions in a single atomic database query.

---

## Setup & Running

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22.23)
- **MongoDB** v6.0+ (running locally on port 27017 or a MongoDB Atlas URI)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Verify or update the variables in `.env`:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/campusconnect
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@campusconnect.edu
ADMIN_PASSWORD=AdminPass2026!
ADMIN_DEPARTMENT=Administrative Services
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Seed the Initial Admin Account
```bash
npm run seed:admin
```

### 5. Start the Server
- **Production Mode:**
  ```bash
  npm start
  ```
- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```
The server will start at `http://localhost:5000` with the health check available at `http://localhost:5000/api/health`.

### 6. Run the Automated Verification Suite
To execute the comprehensive 40-case integration test suite:
```bash
npm test
```

---

## Complete API Reference

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new student (`role: 'student'`) |
| `POST` | `/api/auth/login` | Public | Authenticate student or admin and get JWT |
| `GET` | `/api/auth/me` | Private | Get profile of logged-in user |

#### Example: Student Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aarav Patel",
    "email": "aarav.patel@campus.edu",
    "password": "Password123!",
    "department": "Computer Science & Engineering"
  }'
```

#### Example: User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aarav.patel@campus.edu",
    "password": "Password123!"
  }'
```

---

### Service Request Endpoints (`/api/requests`)

All requests below require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/requests` | Private (Student) | Create new service request (`status: 'Pending'`) |
| `GET` | `/api/requests` | Private | Get requests (Students see own; Admins see all) |
| `GET` | `/api/requests/:id` | Private | Get single request details |
| `PUT` | `/api/requests/:id` | Private (Owner) | Edit request (Allowed **only** while `Pending`) |
| `DELETE` | `/api/requests/:id` | Private (Owner) | Delete request (Allowed **only** while `Pending`) |
| `PUT` | `/api/requests/:id/status` | Private (Admin) | Advance status according to state machine |
| `PUT` | `/api/requests/:id/assign` | Private (Admin) | Assign request to staff member (`role: 'admin'`) |

#### Example: Create Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{
    "title": "Laboratory PC-14 Monitor Display Glitch",
    "description": "The monitor flickers intermittently during CAD sessions in Lab 3.",
    "category": "IT Support",
    "priority": "High"
  }'
```

#### Example: Update Request Status (Admin)
```bash
curl -X PUT http://localhost:5000/api/requests/<REQUEST_ID>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "status": "Under Review",
    "adminResponse": "Ticket acknowledged by Hardware Maintenance Dept."
  }'
```

#### Example: Assign Request to Staff (Admin)
```bash
curl -X PUT http://localhost:5000/api/requests/<REQUEST_ID>/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "assignedTo": "<ADMIN_USER_ID>",
    "adminResponse": "Assigned to Lead Lab Technician."
  }'
```

---

### Admin Dashboard & Management Endpoints (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Private (Admin) | Aggregated statistics, metrics & recent requests |
| `GET` | `/api/admin/requests` | Private (Admin) | List all requests with search & query filters |

#### Example: Get Admin Dashboard Statistics
```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Response Format:**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 14,
    "pendingCount": 4,
    "underReviewCount": 2,
    "assignedCount": 3,
    "inProgressCount": 2,
    "resolvedCount": 2,
    "closedCount": 1,
    "rejectedCount": 0,
    "highPriorityCount": 5,
    "totalStudents": 18,
    "totalAdmins": 2,
    "byStatus": { ... },
    "byPriority": { ... },
    "byCategory": { ... }
  },
  "recentRequests": [ ... ]
}
```
