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
             AND cancelled_at IS NULL
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
      `SELECT b.id, s.starts_at AS "startsAt"
         FROM bookings b
         JOIN shows s ON s.id = b.show_id
        WHERE b.show_id IN (:showIds)
          AND b.status = 'confirmed'
          AND b.ticket_opened_at IS NULL
          AND b.reminder_sent_at IS NULL`,
      { replacements: { showIds }, type: QueryTypes.SELECT, transaction },
    );

    if (bookings.length > 0) {
      await addReminderEmailJobs(
        bookings.map((booking) => ({ bookingId: booking.id, startsAt: booking.startsAt })),
      );
    }
    logger.info(
      `Shows ${showIds.join(", ")} start within ${REMIND_BEFORE_MINUTES} minutes: queued ${bookings.length} reminder email(s)`,
    );
    return { shows: showIds.length, reminders: bookings.length };
  });

module.exports = { queueRemindersForUpcomingShows };
