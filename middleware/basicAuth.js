const crypto = require("crypto");

const sameText = (a, b) => {
  const left = crypto.createHash("sha256").update(a).digest();
  const right = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(left, right);
};

const basicAuth = ({ username, password, realm }) => (req, res, next) => {
  const [scheme, encoded] = (req.get("Authorization") || "").split(" ");

  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString();
    const separator = decoded.indexOf(":");
    const givenUser = decoded.slice(0, separator);
    const givenPassword = decoded.slice(separator + 1);

    const userMatches = sameText(givenUser, username);
    const passwordMatches = sameText(givenPassword, password);
    if (separator !== -1 && userMatches && passwordMatches) {
      return next();
    }
  }

  res.set("WWW-Authenticate", `Basic realm="${realm}"`);
  res.status(401).send("Login required");
};

module.exports = basicAuth;
