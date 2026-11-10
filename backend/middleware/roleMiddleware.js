/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. User context is missing.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${req.user.role}'. Required role(s): ${roles.join(", ")}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
