const createWorker = require("./createWorker");
const { QUEUE_NAME } = require("../queues/ticketEmail");
const {
  sendBookingTicket,
  sendShowUpdatedEmail,
  sendShowCancelledEmail,
} = require("../utils/ticketEmail");

const processors = {
  "send-ticket": (job) => sendBookingTicket(job.data.bookingId),
  "show-updated": (job) => sendShowUpdatedEmail(job.data.bookingId, job.data.startsAt),
  "show-cancelled": (job) => sendShowCancelledEmail(job.data.bookingId),
};

module.exports = createWorker(QUEUE_NAME, "Ticket email", (job) => {
  const handle = processors[job.name];
  if (!handle) {
    throw new Error(`Unknown job type "${job.name}"`);
  }
  return handle(job);
});
