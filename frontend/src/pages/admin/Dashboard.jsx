import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  CircleX,
  Clapperboard,
  Clock,
  Filter,
  IndianRupee,
  LayoutGrid,
  Percent,
  Receipt,
  Tags,
  Ticket,
  TrendingDown,
} from "lucide-react";
import {
  getSummary,
  rankMovies,
  rankTheatres,
  getDaily,
  getShowTimes,
  getGenres,
} from "../../api/analytics";
import Loading from "../../components/Loading";
import Message from "../../components/Message";
import MetricsTable from "../../components/MetricsTable";
import { formatClockTime, formatDate, formatPrice } from "../../utils/format";

const TABS = [
  { key: "summary", title: "Summary", icon: LayoutGrid, load: getSummary },
  { key: "movies", title: "Movies", icon: Clapperboard, load: rankMovies },
  { key: "theatres", title: "Theatres", icon: Building2, load: rankTheatres },
  { key: "daily", title: "Daily", icon: CalendarDays, load: getDaily },
  { key: "showTimes", title: "Show times", icon: Clock, load: getShowTimes },
  { key: "genres", title: "Genres & languages", icon: Tags, load: getGenres },
];

const isRanking = (tab) => tab === "movies" || tab === "theatres";

const Dashboard = () => {
  const [tab, setTab] = useState("summary");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("most");
  const [limit, setLimit] = useState("5");
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // When the user switches tabs quickly, an older tab's answer must not land in the new tab.
    let ignore = false;

    const loadTab = async () => {
      setLoading(true);
      setError("");
      try {
        const { load } = TABS.find((item) => item.key === tab);
        const result = await load(filters);
        if (!ignore) setData(result);
      } catch (error) {
        if (!ignore) setError(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadTab();

    return () => {
      ignore = true;
    };
  }, [tab, filters]);

  const selectTab = (key) => {
    setData(null);
    setTab(key);
    setFilters({ from, to, ...(isRanking(key) && { sort, limit }) });
  };

  const handleApply = (event) => {
    event.preventDefault();
    setFilters({ from, to, ...(isRanking(tab) && { sort, limit }) });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">Numbers for your own theatres only. Cancelled shows are not counted.</p>
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "tab active" : "tab"}
            onClick={() => selectTab(item.key)}
          >
            <item.icon /> {item.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleApply} className="search-bar">
        <label className="inline-label">
          From <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="inline-label">
          To <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        {isRanking(tab) && (
          <>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="most">Most tickets</option>
              <option value="least">Least tickets</option>
            </select>
            <select value={limit} onChange={(event) => setLimit(event.target.value)}>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="50">Top 50</option>
            </select>
          </>
        )}
        <button type="submit">
          <Filter /> Apply
        </button>
      </form>

      {error && <Message type="error">{error}</Message>}
      {loading && <Loading />}
      {!loading && data && (
        <>
          {tab === "summary" && <Summary summary={data.summary} />}
          {tab === "movies" && (
            <MetricsTable
              rows={data.results}
              labelColumns={[
                { key: "title", title: "Movie" },
                { key: "language", title: "Language" },
                { key: "genre", title: "Genre" },
              ]}
            />
          )}
          {tab === "theatres" && (
            <MetricsTable
              rows={data.results}
              labelColumns={[
                { key: "name", title: "Theatre" },
                { key: "city", title: "City" },
              ]}
            />
          )}
          {tab === "daily" && (
            <MetricsTable rows={data.days} labelColumns={[{ key: "date", title: "Date", format: formatDate }]} />
          )}
          {tab === "showTimes" && (
            <>
              <h3>By show time</h3>
              <MetricsTable
                rows={data.byShowTime}
                labelColumns={[{ key: "showTime", title: "Time", format: formatClockTime }]}
              />
              <h3>By day of the week</h3>
              <MetricsTable rows={data.byWeekday} labelColumns={[{ key: "weekday", title: "Day" }]} />
            </>
          )}
          {tab === "genres" && (
            <>
              <h3>By genre</h3>
              <MetricsTable rows={data.byGenre} labelColumns={[{ key: "genre", title: "Genre" }]} />
              <h3>By language</h3>
              <MetricsTable rows={data.byLanguage} labelColumns={[{ key: "language", title: "Language" }]} />
            </>
          )}
        </>
      )}
    </div>
  );
};

const Summary = ({ summary }) => {
  const items = [
    ["Revenue", formatPrice(summary.revenue), IndianRupee],
    ["Bookings", summary.bookings, Receipt],
    ["Tickets sold", summary.tickets, Ticket],
    ["Occupancy", `${summary.occupancyPercent}%`, Percent],
    ["Shows", summary.shows, Clapperboard],
    ["Upcoming shows", summary.upcomingShows, CalendarClock],
    ["Cancellations", summary.cancellations, CircleX],
    ["Cancellation rate", `${summary.cancellationRatePercent}%`, TrendingDown],
  ];

  return (
    <div className="summary-grid">
      {items.map(([label, value, Icon]) => (
        <div key={label} className="summary-item">
          <div className="summary-label">
            <span className="muted">{label}</span>
            <span className="summary-icon">
              <Icon />
            </span>
          </div>
          <div className="summary-value">{value}</div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
