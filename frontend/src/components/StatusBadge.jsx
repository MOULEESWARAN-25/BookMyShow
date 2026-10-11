import { CalendarClock, CircleCheck, CircleX, History } from "lucide-react";

const STATUSES = {
  upcoming: { label: "Upcoming", icon: CalendarClock, tone: "success" },
  confirmed: { label: "Confirmed", icon: CircleCheck, tone: "success" },
  started: { label: "Started", icon: History, tone: "" },
  over: { label: "Show over", icon: History, tone: "" },
  cancelled: { label: "Cancelled", icon: CircleX, tone: "danger" },
};

const StatusBadge = ({ status }) => {
  const { label, icon: Icon, tone } = STATUSES[status];

  return (
    <span className={`badge ${tone}`}>
      <Icon /> {label}
    </span>
  );
};

export default StatusBadge;
