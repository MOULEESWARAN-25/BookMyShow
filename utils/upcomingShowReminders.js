const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");
const { addReminderEmailJobs } = require("../queues/showReminder");
const { logger } = require("./logger");

const REMIND_BEFORE_MINUTES = 30;

const queueRemindersForUpcomingShows = () =>
  sequelize.transaction(async (transaction) => {
    const shows = await sequelize.query(
      `UPDATE shows SET reminder_queued_at = now()
        WHERE id IN (
          SELECT id FROM shows
           WHERE reminder_queued_at IS NULL
             AND starts_at > now()
             AND starts_at <= now() + make_interval(mins => :minutes)
           FOR UPDATE SKIP LOCKED
        )
        RETURNING id`,
      {
        replacements: { minutes: REMIND_BEFORE_MINUTES },
        type: QueryTypes.SELECT,
        transaction,
      },
    );
    if (shows.length === 0) {
      return { shows: 0, reminders: 0 };
    }

    const showIds = shows.map((show) => show.id);
    const bookings = await sequelize.query(
      `SELECT id FROM bookings
        WHERE show_id IN (:showIds)
          AND status = 'confirmed'
          AND ticket_opened_at IS NULL
          AND reminder_sent_at IS NULL`,
      { replacements: { showIds }, type: QueryTypes.SELECT, transaction },
    );

    if (bookings.length > 0) {
      await addReminderEmailJobs(bookings.map((booking) => booking.id));
    }
    logger.info(
      `Shows ${showIds.join(", ")} start within ${REMIND_BEFORE_MINUTES} minutes: queued ${bookings.length} reminder email(s)`,
    );
    return { shows: showIds.length, reminders: bookings.length };
  });

module.exports = { queueRemindersForUpcomingShows };
