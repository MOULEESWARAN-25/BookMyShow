import { useEffect, useState } from "react";
import {
  Building2,
  Clapperboard,
  Clock,
  Filter,
  IndianRupee,
  LayoutGrid,
  MapPin,
  Percent,
  Receipt,
  Ticket,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  getSummary,
  getSlowShows,
  getSiteSummary,
  rankMovies,
  rankTheatres,
  rankOwners,
  rankCities,
  getDaily,
  getShowTimes,
  getGenres,
} from "../../api/analytics";
import Loading from "../../components/Loading";
import Message from "../../components/Message";
import MetricsTable from "../../components/MetricsTable";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import {
  formatClockTime,
  formatCompact,
  formatDate,
  formatDateTime,
  formatShortDate,
} from "../../utils/format";

// A tab can need more than one API call; their answers are merged into one object.
const loadAll =
  (...loaders) =>
  async (filters) => {
    const answers = await Promise.all(loaders.map((load) => load(filters)));
    return Object.assign({}, ...answers);
  };

// A theatre owner wants to know what to change: which shows, movies, times and theatres sell poorly.
const THEATRE_OWNER_TABS = [
  { key: "overview", title: "Overview", icon: LayoutGrid, load: loadAll(getSummary, getDaily, getSlowShows) },
  { key: "movies", title: "Movies", icon: Clapperboard, load: loadAll(rankMovies, getGenres) },
  { key: "showTimes", title: "Show times", icon: Clock, load: getShowTimes },
  { key: "theatres", title: "Theatres", icon: Building2, load: rankTheatres },
];

// The site owner looks at the business as a whole: money, customers, partners and cities.
const SITE_TABS = [
  { key: "overview", title: "Overview", icon: LayoutGrid, load: loadAll(getSiteSummary, getDaily) },
  { key: "owners", title: "Theatre owners", icon: UserCog, load: rankOwners },
  { key: "cities", title: "Cities", icon: MapPin, load: rankCities },
  { key: "movies", title: "Movies", icon: Clapperboard, load: loadAll(rankMovies, getGenres) },
];

const Dashboard = ({ global = false }) => {
  const TABS = global ? SITE_TABS : THEATRE_OWNER_TABS;
  const [tab, setTab] = useState("overview");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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

  // Switching tabs keeps the dates already applied; typed dates only count after Apply.
  const selectTab = (key) => {
    setData(null);
    setTab(key);
  };

  const handleApply = (event) => {
    event.preventDefault();
    setFilters({ from, to });
  };

  const clearDates = () => {
    setFrom("");
    setTo("");
    setFilters({});
  };

  return (
    <div>
      <div className="page-header">
        <h1>{global ? "Site analytics" : "Dashboard"}</h1>
        <p className="muted">
          {global
            ? "How the whole site is doing. Cancelled shows are not counted."
            : "How your own theatres are doing. Cancelled shows are not counted."}
        </p>
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
          From{" "}
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="inline-label">
          To{" "}
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button type="submit">
          <Filter /> Apply
        </button>
        {(from || to || filters.from || filters.to) && (
          <button type="button" className="secondary" onClick={clearDates}>
            <X /> Clear
          </button>
        )}
        <span className="muted date-range">{describeDates(filters)}</span>
      </form>

      {error && <Message type="error">{error}</Message>}
      {loading && <Loading />}
      {!loading && data && (
        <>
          {tab === "overview" && !global && (
            <>
              <SummaryCards
                items={[
                  ["Revenue", formatWholePrice(data.summary.revenue), IndianRupee],
                  ["Tickets sold", formatCount(data.summary.tickets), Ticket],
                  ["Occupancy", percent(data.summary.occupancyPercent), Percent],
                  ["Shows", formatCount(data.summary.shows), Clapperboard],
                ]}
              />
              <div className="chart-grid">
                <ChartCard title="Revenue per day" note={BY_SHOW_DATE}>
                  <RevenuePerDay days={data.days} />
                </ChartCard>
                <ChartCard
                  title="Shows selling slowly"
                  note="Next 3 days, most empty seats first. Worth promoting before they start."
                >
                  <SlowShows shows={data.shows} />
                </ChartCard>
              </div>
              <DailyTable days={data.days} />
            </>
          )}
          {tab === "overview" && global && (
            <>
              <SummaryCards
                items={[
                  ["Revenue", formatWholePrice(data.summary.revenue), IndianRupee],
                  ["Tickets sold", formatCount(data.summary.tickets), Ticket],
                  ["Bookings", formatCount(data.summary.bookings), Receipt],
                  ["Customers who booked", formatCount(data.summary.customersWhoBooked), UserCheck],
                  ["Registered customers", formatCount(data.summary.registeredCustomers), Users],
                  ["Theatre owners", formatCount(data.summary.theatreOwners), UserCog],
                  ["Theatres", formatCount(data.summary.theatres), Building2],
                  ["Cities", formatCount(data.summary.cities), MapPin],
                ]}
              />
              <p className="muted summary-note">
                The last four are today's totals, whatever the dates.
              </p>
              <ChartCard title="Revenue per day" note={BY_SHOW_DATE}>
                <RevenuePerDay days={data.days} />
              </ChartCard>
              <DailyTable days={data.days} />
            </>
          )}
          {tab === "movies" && (
            <>
              {global ? (
                <ChartCard title="Revenue by movie">
                  <BarChart rows={toRows(data.results, "title", "revenue")} formatValue={formatShortPrice} />
                </ChartCard>
              ) : (
                <ChartCard
                  title="Occupancy by movie"
                  note="Share of seats sold. Movies near the bottom may need fewer shows."
                >
                  <BarChart
                    rows={toRows(sortBy(data.results, "occupancyPercent"), "title", "occupancyPercent")}
                    formatValue={percent}
                    max={100}
                  />
                </ChartCard>
              )}
              <div className="chart-grid">
                <ChartCard title="Tickets by genre">
                  <DonutChart rows={toRows(data.byGenre, "genre", "tickets")} formatValue={formatCount} totalLabel="Tickets" />
                </ChartCard>
                <ChartCard title="Tickets by language">
                  <DonutChart rows={toRows(data.byLanguage, "language", "tickets")} formatValue={formatCount} totalLabel="Tickets" />
                </ChartCard>
              </div>
              <TableView>
                <MetricsTable
                  rows={data.results}
                  labelColumns={[
                    { key: "title", title: "Movie" },
                    { key: "language", title: "Language" },
                    { key: "genre", title: "Genre" },
                  ]}
                />
              </TableView>
            </>
          )}
          {tab === "showTimes" && (
            <>
              <div className="chart-grid">
                <ChartCard title="Occupancy by show time" note="Quiet times are the ones to cut or discount.">
                  <BarChart
                    rows={data.byShowTime.map((row) => ({ label: formatClockTime(row.showTime), value: row.occupancyPercent }))}
                    formatValue={percent}
                    max={100}
                  />
                </ChartCard>
                <ChartCard title="Occupancy by day of the week" note="Busy days can take more shows.">
                  <BarChart rows={toRows(data.byWeekday, "weekday", "occupancyPercent")} formatValue={percent} max={100} />
                </ChartCard>
              </div>
              <TableView>
                <h3>By show time</h3>
                <MetricsTable
                  rows={data.byShowTime}
                  labelColumns={[{ key: "showTime", title: "Time", format: formatClockTime }]}
                />
                <h3>By day of the week</h3>
                <MetricsTable rows={data.byWeekday} labelColumns={[{ key: "weekday", title: "Day" }]} />
              </TableView>
            </>
          )}
          {tab === "theatres" && (
            <>
              <ChartCard title="Occupancy by theatre">
                <BarChart
                  rows={toRows(sortBy(data.results, "occupancyPercent"), "name", "occupancyPercent")}
                  formatValue={percent}
                  max={100}
                />
              </ChartCard>
              <TableView>
                <MetricsTable
                  rows={data.results}
                  labelColumns={[
                    { key: "name", title: "Theatre" },
                    { key: "city", title: "City" },
                  ]}
                />
              </TableView>
            </>
          )}
          {tab === "owners" && (
            <>
              <ChartCard
                title="Revenue by theatre owner"
                note="Owners near the bottom may need help, or may have stopped adding shows."
              >
                <BarChart rows={toRows(data.results, "name", "revenue")} formatValue={formatShortPrice} />
              </ChartCard>
              <TableView>
                <MetricsTable
                  rows={data.results}
                  labelColumns={[
                    { key: "name", title: "Theatre owner" },
                    { key: "theatres", title: "Theatres" },
                  ]}
                />
              </TableView>
            </>
          )}
          {tab === "cities" && (
            <>
              <ChartCard title="Share of revenue by city">
                <DonutChart rows={toRows(data.results, "city", "revenue")} formatValue={formatShortPrice} totalLabel="Revenue" />
              </ChartCard>
              <TableView>
                <MetricsTable
                  rows={data.results}
                  labelColumns={[
                    { key: "city", title: "City" },
                    { key: "theatres", title: "Theatres" },
                  ]}
                />
              </TableView>
            </>
          )}
        </>
      )}
    </div>
  );
};

// Says which shows the numbers cover, so typed but not yet applied dates cannot be mistaken for the real ones.
const describeDates = ({ from, to }) => {
  if (from && to) return from === to ? `Shows on ${formatDay(from)}` : `Shows from ${formatDay(from)} to ${formatDay(to)}`;
  if (from) return `Shows from ${formatDay(from)} onwards`;
  if (to) return `Shows up to ${formatDay(to)}`;
  return "All shows";
};

// Small helpers that turn API rows into what the charts expect.
const toRows = (rows, labelKey, valueKey) => rows.map((row) => ({ label: row[labelKey], value: row[valueKey] }));
const sortBy = (rows, key) => [...rows].sort((a, b) => b[key] - a[key]);
const percent = (value) => `${value}%`;
// "2026-10-08" read as a local day, so it never slips to the day before.
const formatDay = (value) => formatDate(`${value}T00:00:00`);
const formatCount = (value) => Number(value).toLocaleString("en-IN");
const formatShortPrice = (value) => `Rs. ${formatCompact(value)}`;
// Ticket prices are whole rupees, so a total never has paise and the card can skip the ".00".
const formatWholePrice = (value) => `Rs. ${formatCount(value)}`;

// Daily numbers are grouped by the day of the show, not the day the ticket was bought,
// so days further ahead show less because fewer tickets have been sold for them yet.
const BY_SHOW_DATE = "By show date. Later days are still selling.";

const ChartCard = ({ title, note, children }) => (
  <section className="panel chart-card">
    <h3>{title}</h3>
    {note && <p className="muted chart-note">{note}</p>}
    {children}
  </section>
);

const RevenuePerDay = ({ days }) => (
  <LineChart
    points={days.map((day) => ({ label: formatShortDate(day.date), value: day.revenue }))}
    formatValue={formatWholePrice}
    formatAxis={formatCompact}
  />
);

// The exact numbers stay one click away, for anyone who cannot or does not want to read a chart.
const TableView = ({ label = "View as table", children }) => (
  <details className="table-view">
    <summary>{label}</summary>
    {children}
  </details>
);

const DailyTable = ({ days }) => (
  <TableView label="View day by day">
    <MetricsTable rows={days} labelColumns={[{ key: "date", title: "Date", format: formatDay }]} />
  </TableView>
);

const SlowShows = ({ shows }) => {
  if (shows.length === 0) {
    return <p className="muted">No shows in the next 3 days.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Show</th>
          <th className="number">Seats sold</th>
        </tr>
      </thead>
      <tbody>
        {shows.map((show) => (
          <tr key={show.id}>
            <td>
              <strong>{show.movie}</strong>
              <span className="muted cell-detail">
                {show.theatre} · {formatDateTime(show.startsAt)}
              </span>
            </td>
            <td className="number">
              {show.tickets} of {show.capacity}
              <span className="muted cell-detail">{percent(show.occupancyPercent)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const SummaryCards = ({ items }) => (
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

export default Dashboard;
