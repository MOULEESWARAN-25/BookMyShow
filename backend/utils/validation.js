const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_RULE =
  "Password must be at least 8 characters long and contain at least one letter and one number";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

module.exports = {
  parseId,
  isNonEmptyString,
  escapeLike,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PASSWORD_RULE,
  normalizeEmail,
};
