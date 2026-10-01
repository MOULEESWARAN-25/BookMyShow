const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const ticketEmail = require("./ticketEmail");
const showReminder = require("./showReminder");

const BASE_PATH = "/admin/queues";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(BASE_PATH);

createBullBoard({
  queues: [
    new BullMQAdapter(ticketEmail.getQueue()),
    new BullMQAdapter(showReminder.getQueue()),
  ],
  serverAdapter,
});

module.exports = { BASE_PATH, router: serverAdapter.getRouter() };
