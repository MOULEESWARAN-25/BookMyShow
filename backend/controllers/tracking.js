const { Op } = require("sequelize");
const { Booking } = require("../models");
const { verifyOpenToken } = require("../utils/emailTracking");
const { logger } = require("../utils/logger");

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const trackEmailOpen = async (req, res) => {
  const bookingId = verifyOpenToken(req.params.token);
  if (bookingId) {
    const [updated] = await Booking.update(
      { ticketOpenedAt: new Date() },
      { where: { id: bookingId, ticketOpenedAt: { [Op.is]: null } } },
    );
    if (updated) {
      logger.info(`Booking ${bookingId}: ticket email opened`);
    }
  }

  res.set({
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
  });
  res.send(TRANSPARENT_GIF);
};

module.exports = { trackEmailOpen };
