const crypto = require("crypto");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

const sign = (bookingId) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`email-open:${bookingId}`)
    .digest("hex")
    .slice(0, 32);

const openTrackingUrl = (bookingId) =>
  `${APP_URL}/api/tracking/open/${bookingId}.${sign(bookingId)}.gif`;

const verifyOpenToken = (token) => {
  const match = /^(\d+)\.([0-9a-f]{32})\.gif$/.exec(token);
  if (!match) {
    return null;
  }
  const bookingId = Number(match[1]);
  const expected = Buffer.from(sign(bookingId));
  const given = Buffer.from(match[2]);
  return crypto.timingSafeEqual(expected, given) ? bookingId : null;
};

module.exports = { openTrackingUrl, verifyOpenToken };
