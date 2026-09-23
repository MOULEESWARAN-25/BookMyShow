const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

// Escapes the LIKE wildcards so user input is matched literally.
const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");

module.exports = {
  parseId,
  isNonEmptyString,
  escapeLike,
};
