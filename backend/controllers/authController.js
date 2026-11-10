const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Generate signed JWT token
 * @param {string} id User ID
 * @param {string} role User role
 * @returns {string} Signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * @desc    Register a new student account
 * @route   POST /api/auth/register
 * @access  Public
 * @note    Public registration strictly creates student accounts.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    // Field presence checks
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, password, department.",
      });
    }

    if (typeof password !== "string" || password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 12 characters long. Passphrases are encouraged.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 128 characters.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    // Explicitly enforce 'student' role for public registration
    // Prevents privilege escalation even if 'role' is provided in req.body
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "student",
      department: department.trim(),
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "Student account registered successfully.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user (student or admin) and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Authentication successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (name, department)
 * @route   PUT /api/auth/profile
 * @access  Private
 * @note    Updates only authenticated user's own account (req.user._id).
 *          Role modification is strictly prohibited to prevent privilege escalation.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, department } = req.body;

    if (!name && !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update (name or department).",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a valid, non-empty text string.",
        });
      }
      user.name = name.trim();
    }

    if (department !== undefined) {
      if (typeof department !== "string" || !department.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department must be a valid, non-empty text string.",
        });
      }
      user.department = department.trim();
    }

    // Role, email, and ID changes are strictly ignored to prevent privilege escalation.
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user password
 * @route   PUT /api/auth/password
 * @access  Private
 * @note    Verifies current password and securely hashes new password with bcrypt.
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current password and new password.",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 12) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 12 characters long. Passphrases are encouraged.",
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: "New password cannot exceed 128 characters.",
      });
    }

    // Retrieve user including password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Update password; pre-save hook handles bcrypt salt hashing
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  generateToken,
};
