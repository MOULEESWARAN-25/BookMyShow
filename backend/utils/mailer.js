const nodemailer = require("nodemailer");

const port = Number(process.env.SMTP_PORT || 1025);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port,
  secure: port === 465,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const MAIL_FROM = process.env.MAIL_FROM || "BookMyShow <tickets@bookmyshow.local>";

const sendMail = (message) => transporter.sendMail({ from: MAIL_FROM, ...message });

module.exports = { sendMail };
