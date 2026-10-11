import { toDateKey } from "../utils/format";

// "2026-10-05" => { weekday: "Today", day: 5, month: "Oct" }, read as a local date.
const dateParts = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = toDateKey(new Date());
  const tomorrow = toDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

  let weekday = date.toLocaleDateString("en-IN", { weekday: "short" });
  if (dateKey === today) weekday = "Today";
  if (dateKey === tomorrow) weekday = "Tomorrow";

  return {
    weekday,
    day: date.getDate(),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
  };
};

// A row of days to choose from. dates are "YYYY-MM-DD" strings.
// availableDates (optional) are the days that have shows; the other days are shown but cannot be picked.
const DateStrip = ({ dates, availableDates = dates, selectedDate, onSelect }) => (
  <div className="date-strip" role="group" aria-label="Choose a date">
    {dates.map((dateKey) => {
      const { weekday, day, month } = dateParts(dateKey);
      return (
        <button
          key={dateKey}
          className={dateKey === selectedDate ? "date-chip active" : "date-chip"}
          aria-pressed={dateKey === selectedDate}
          aria-label={`${weekday} ${day} ${month}`}
          disabled={!availableDates.includes(dateKey)}
          title={availableDates.includes(dateKey) ? undefined : "No shows on this day"}
          onClick={() => onSelect(dateKey)}
        >
          <span>{weekday}</span>
          <strong>{day}</strong>
          <span>{month}</span>
        </button>
      );
    })}
  </div>
);

export default DateStrip;
