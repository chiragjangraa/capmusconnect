/**
 * Centralized API Client for CampusConnect
 * Communicates with Express backend running at http://localhost:5000/api
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TOKEN_STORAGE_KEY = "campusconnect_auth_token";
const USER_STORAGE_KEY = "campusconnect_auth_user";

/**
 * LocalStorage Helpers (SSR Safe)
 */
export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to persist auth token:", err);
  }
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to persist user profile:", err);
  }
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear auth storage:", err);
  }
};

/**
 * Core HTTP Request Wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    ...(options.headers || {}),
  };

  // Auto-inject JSON Content-Type if payload is present and not FormData
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  // Auto-inject Bearer Token
  const token = getStoredToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Parse response
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;

      // Token invalid or expired: clear storage
      if (response.status === 401 && !endpoint.includes("/auth/login")) {
        clearStoredAuth();
      }

      throw error;
    }

    return data;
  } catch (err) {
    // Rethrow normalized error
    if (!err.status) {
      err.status = 0;
      err.message =
        err.message === "Failed to fetch"
          ? "Unable to connect to CampusConnect server. Please verify backend is running on port 5000."
          : err.message;
    }
    throw err;
  }
}

/**
 * Authentication Endpoints
 */
export const authAPI = {
  /**
   * Register a new student
   * @param {{ name: string, email: string, password: string, department: string }} userData
   */
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  /**
   * Authenticate student or admin
   * @param {{ email: string, password: string }} credentials
   */
  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  /**
   * Fetch current authenticated user profile
   */
  getMe: () =>
    apiRequest("/auth/me", {
      method: "GET",
    }),

  /**
   * Update authenticated user profile (name, department)
   * @param {{ name?: string, department?: string }} profileData
   */
  updateProfile: (profileData) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  /**
   * Update authenticated user password
   * @param {{ currentPassword: string, newPassword: string }} passwordData
   */
  updatePassword: (passwordData) =>
    apiRequest("/auth/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    }),
};

/**
 * Service Request Endpoints
 */
export const requestsAPI = {
  /**
   * List requests (Students see own; Admins see all)
   * @param {Object} [params] - Query filters (status, category, priority, search)
   */
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return apiRequest(`/requests${queryStr ? `?${queryStr}` : ""}`, {
      method: "GET",
    });
  },

  /**
   * Get single request by ID
   * @param {string} id Request ObjectId
   */
  getById: (id) =>
    apiRequest(`/requests/${id}`, {
      method: "GET",
    }),

  /**
   * Create new service request (Student only, defaults to 'Pending')
   * @param {{ title: string, description: string, category: string, priority?: string }} data
   */
  create: (data) =>
    apiRequest("/requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update request (Allowed only while status === 'Pending')
   * @param {string} id
   * @param {{ title?: string, description?: string, category?: string, priority?: string }} data
   */
  update: (id, data) =>
    apiRequest(`/requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete request (Allowed only while status === 'Pending')
   * @param {string} id
   */
  delete: (id) =>
    apiRequest(`/requests/${id}`, {
      method: "DELETE",
    }),

  /**
   * Update status (Admin only - validates state machine)
   * @param {string} id
   * @param {{ status: string, adminResponse?: string }} data
   */
  updateStatus: (id, data) =>
    apiRequest(`/requests/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Assign request to staff/admin (Admin only)
   * @param {string} id
   * @param {{ assignedTo: string, adminResponse?: string }} data
   */
  assign: (id, data) =>
    apiRequest(`/requests/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

/**
 * Admin Management Endpoints
 */
export const adminAPI = {
  /**
   * Fetch aggregated dashboard statistics
   */
  getDashboard: () =>
    apiRequest("/admin/dashboard", {
      method: "GET",
    }),

  /**
   * List all requests with admin filters
   * @param {Object} [params]
   */
  getAllRequests: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return apiRequest(`/admin/requests${queryStr ? `?${queryStr}` : ""}`, {
      method: "GET",
    });
  },

  /**
   * List all students with search and department filtering (Admin only)
   * @param {Object} [params] - Query filters (search, department)
   */
  getStudents: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return apiRequest(`/admin/students${queryStr ? `?${queryStr}` : ""}`, {
      method: "GET",
    });
  },

  /**
   * Get single student profile and their service requests (Admin only)
   * @param {string} id - Student User ObjectId
   */
  getStudentById: (id) =>
    apiRequest(`/admin/students/${id}`, {
      method: "GET",
    }),
};

/**
 * Course Catalog & Management Endpoints
 */
export const coursesAPI = {
  /**
   * List all courses with search, category, department filters
   * @param {Object} [params] - Query filters (search, category, department, sort)
   */
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return apiRequest(`/courses${queryStr ? `?${queryStr}` : ""}`, {
      method: "GET",
    });
  },

  /**
   * Get single course details by MongoDB _id or course code
   * @param {string} id - Course code or MongoDB ObjectId
   */
  getById: (id) =>
    apiRequest(`/courses/${id}`, {
      method: "GET",
    }),

  /**
   * Create a new course (Admin only)
   * @param {Object} courseData
   */
  create: (courseData) =>
    apiRequest("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    }),

  /**
   * Update an existing course (Admin only)
   * @param {string} id
   * @param {Object} courseData
   */
  update: (id, courseData) =>
    apiRequest(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(courseData),
    }),

  /**
   * Delete a course (Admin only)
   * @param {string} id
   */
  delete: (id) =>
    apiRequest(`/courses/${id}`, {
      method: "DELETE",
    }),
};

/**
 * Coursework & Assignments Endpoints
 */
export const assignmentsAPI = {
  /**
   * List coursework assignments with student-specific status
   * @param {Object} [params] - Query filters (search, status, courseCode)
   */
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return apiRequest(`/assignments${queryStr ? `?${queryStr}` : ""}`, {
      method: "GET",
    });
  },

  /**
   * Get single assignment details
   * @param {string} id - Assignment ObjectId
   */
  getById: (id) =>
    apiRequest(`/assignments/${id}`, {
      method: "GET",
    }),

  /**
   * Submit an assignment deliverable (Student / User)
   * @param {string} id - Assignment ObjectId
   * @param {{ fileName: string, notes?: string }} data
   */
  submit: (id, data) =>
    apiRequest(`/assignments/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Create an assignment (Admin only)
   * @param {Object} data
   */
  create: (data) =>
    apiRequest("/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an assignment (Admin only)
   * @param {string} id
   * @param {Object} data
   */
  update: (id, data) =>
    apiRequest(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Grade a submission (Admin only)
   * @param {string} id
   * @param {{ studentId: string, score: string, feedback?: string, status?: string }} data
   */
  grade: (id, data) =>
    apiRequest(`/assignments/${id}/grade`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete an assignment (Admin only)
   * @param {string} id
   */
  delete: (id) =>
    apiRequest(`/assignments/${id}`, {
      method: "DELETE",
    }),
};
