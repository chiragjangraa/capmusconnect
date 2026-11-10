/**
 * Safely escapes special regular expression characters in user search input
 * Prevents ReDoS attacks and RegExp syntax errors on inputs like '(', '[', '*', etc.
 * @param {string} str User input string
 * @returns {string} Escaped string safe for new RegExp()
 */
const escapeRegex = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = { escapeRegex };
