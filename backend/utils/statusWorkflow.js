/**
 * CampusConnect Service Request Status Workflow State Machine
 *
 * Exact progression specified by assessment requirements:
 * Pending -> Under Review -> Assigned -> In Progress -> Resolved -> Closed
 * Allowed 'Rejected' only from appropriate initial stages ('Pending' and 'Under Review').
 */

const ALLOWED_STATUS_TRANSITIONS = {
  Pending: ["Under Review", "Rejected"],
  "Under Review": ["Assigned", "Rejected"],
  Assigned: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: ["Closed"],
  Closed: [], // Terminal stage
  Rejected: [], // Terminal stage
};

const ALL_STATUSES = Object.keys(ALLOWED_STATUS_TRANSITIONS);

/**
 * Validates whether a status transition is permitted.
 * @param {string} currentStatus Current status of the request
 * @param {string} targetStatus Proposed new status
 * @returns {{ isValid: boolean, message?: string, allowedTransitions?: string[] }}
 */
function validateStatusTransition(currentStatus, targetStatus) {
  if (!ALL_STATUSES.includes(currentStatus)) {
    return {
      isValid: false,
      message: `Current status '${currentStatus}' is not recognized.`,
    };
  }

  if (!ALL_STATUSES.includes(targetStatus)) {
    return {
      isValid: false,
      message: `Target status '${targetStatus}' is not valid. Valid statuses are: ${ALL_STATUSES.join(", ")}.`,
    };
  }

  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      message: `Request is already in '${currentStatus}' status.`,
      allowedTransitions: ALLOWED_STATUS_TRANSITIONS[currentStatus],
    };
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    const allowedMsg =
      allowed.length > 0
        ? `Allowed transitions from '${currentStatus}' are: ${allowed.join(", ")}.`
        : `'${currentStatus}' is a terminal stage. No further transitions are permitted.`;

    return {
      isValid: false,
      message: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. ${allowedMsg}`,
      allowedTransitions: allowed,
    };
  }

  return {
    isValid: true,
  };
}

module.exports = {
  ALLOWED_STATUS_TRANSITIONS,
  ALL_STATUSES,
  validateStatusTransition,
};
