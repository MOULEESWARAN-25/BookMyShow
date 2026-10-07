const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });

const formatTime = (value) => new Date(value).toLocaleTimeString("en-IN", { timeStyle: "short" });

// "14:30" (a time of day without a date, as the analytics API sends it) => "2:30 pm"
const formatClockTime = (value) => formatTime(`2000-01-01T${value}:00`);

// "\u00a0" is a non-breaking space, so "Rs." never wraps onto a different line from the amount.
const formatPrice = (value) =>
  `Rs.\u00a0${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// The local calendar day of a date-time, as "YYYY-MM-DD", for grouping shows by day.
const toDateKey = (value) => {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Short numbers for chart axes: 330000 => "3.3L", 4500 => "4.5K".
const formatCompact = (value) =>
  Number(value).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 });

// "2026-10-05" => "5 Oct", for chart axis labels.
const formatShortDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time, not an ISO string.
const toDateTimeInput = (value) => {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitSeatNumber = (seatNumber) => {
  const [, row, number] = seatNumber.match(/^([A-Z]+)(\d+)$/);
  return { row, number: Number(number) };
};

export {
  formatDateTime,
  formatDate,
  formatTime,
  formatClockTime,
  formatPrice,
  formatCompact,
  formatShortDate,
  toDateKey,
  toDateTimeInput,
  splitSeatNumber,
};
