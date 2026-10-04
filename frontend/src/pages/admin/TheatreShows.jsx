import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Armchair,
  Ban,
  Building2,
  CalendarDays,
  CalendarPlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { listMyTheatres, listTheatreShows } from "../../api/theatre";
import { listAllMovies } from "../../api/movie";
import { createShow, updateShow, deleteShow } from "../../api/show";
import useAction from "../../hooks/useAction";
import Loading from "../../components/Loading";
import DateStrip from "../../components/DateStrip";
import ManageSeats from "../../components/ManageSeats";
import Message from "../../components/Message";
import StatusBadge from "../../components/StatusBadge";
import Toasts from "../../components/Toasts";
import { formatPrice, formatTime, toDateKey, toDateTimeInput } from "../../utils/format";
import { groupBy } from "../../utils/group";
import { parseSeatRows } from "../../utils/seatRows";

const EMPTY_SHOW = {
  movieId: "",
  startsAt: "",
  endsAt: "",
  price: "",
  seatRows: "A, B, C, D, E",
  seatsPerRow: "10",
  repeatDays: "1",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REPEAT_DAYS = 14;

const statusOf = (show) => {
  if (show.cancelledAt) return "cancelled";
  if (new Date(show.startsAt) <= new Date()) return "started";
  return "upcoming";
};

const TheatreShows = () => {
  const { theatreId } = useParams();
  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [newShow, setNewShow] = useState(EMPTY_SHOW);
  const [editing, setEditing] = useState(null);
  const [seatsShow, setSeatsShow] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { message, error, busy, run, setError, clear } = useAction();

  const loadShows = async () => {
    try {
      const data = await listTheatreShows(theatreId);
      setShows(data.shows);
    } catch (error) {
      setLoadError(error.message);
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [theatreData, movieData] = await Promise.all([listMyTheatres(), listAllMovies()]);
        const ownTheatre = theatreData.theatres.find((item) => item.id === Number(theatreId));
        if (!ownTheatre) {
          setLoadError("This theatre does not exist or is not yours.");
          return;
        }
        setTheatre(ownTheatre);
        setMovies(movieData.movies);
        await loadShows();
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [theatreId]);

  // Adds the same show once a day for "Repeat for" days. A day that clashes with another show
  // is skipped and the other days are still added; the message says which days were skipped.
  const handleCreate = async (event) => {
    event.preventDefault();
    const days = Number(newShow.repeatDays);
    const firstStart = new Date(newShow.startsAt).getTime();
    const firstEnd = new Date(newShow.endsAt).getTime();
    let added = 0;

    const data = await run(async () => {
      const skipped = [];
      for (let day = 0; day < days; day++) {
        const startsAt = new Date(firstStart + day * DAY_MS);
        try {
          await createShow({
            movieId: Number(newShow.movieId),
            theatreId: Number(theatreId),
            startsAt: startsAt.toISOString(),
            endsAt: new Date(firstEnd + day * DAY_MS).toISOString(),
            price: Number(newShow.price),
            seatRows: parseSeatRows(newShow.seatRows),
            seatsPerRow: Number(newShow.seatsPerRow),
          });
          added += 1;
        } catch (error) {
          skipped.push({ date: startsAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), reason: error.message });
        }
      }

      if (added === 0) {
        throw new Error(skipped[0].reason);
      }
      if (skipped.length > 0) {
        // "Skipped 6 Oct, 7 Oct: This theatre already has a show during that time"
        const reasons = groupBy(skipped, (item) => item.reason).map(
          ([reason, items]) => `${items.map((item) => item.date).join(", ")}: ${reason}`,
        );
        throw new Error(`Added ${added} of ${days} shows. Skipped ${reasons.join(". ")}`);
      }
      return { message: added === 1 ? "Show created successfully" : `${added} shows created` };
    });

    if (added > 0) {
      setSelectedDate(toDateKey(firstStart));
      await loadShows();
    }
    if (data) {
      setNewShow(EMPTY_SHOW);
    }
  };

  const startEditing = (show) => {
    setEditing({
      id: show.id,
      startsAt: toDateTimeInput(show.startsAt),
      endsAt: toDateTimeInput(show.endsAt),
      price: String(show.price),
    });
  };

  const handleSave = async () => {
    if (!editing.startsAt || !editing.endsAt || editing.price === "") {
      setError("Start time, end time and price are all required");
      return;
    }

    const data = await run(() =>
      updateShow(editing.id, {
        startsAt: new Date(editing.startsAt).toISOString(),
        endsAt: new Date(editing.endsAt).toISOString(),
        price: Number(editing.price),
      }),
    );
    if (data) {
      setEditing(null);
      await loadShows();
    }
  };

  const handleDelete = async (show) => {
    const question =
      show.bookedSeats > 0
        ? "This show has bookings, so it will be cancelled and customers will be emailed. Continue?"
        : `Delete this show of ${show.movieTitle}?`;
    if (!window.confirm(question)) return;

    const data = await run(() => deleteShow(show.id));
    if (data) {
      if (seatsShow?.id === show.id) {
        setSeatsShow(null);
      }
      await loadShows();
    }
  };

  const updateNewShow = (field) => (event) => {
    const changed = { ...newShow, [field]: event.target.value };
    const movie = movies.find((item) => item.id === Number(changed.movieId));
    if ((field === "movieId" || field === "startsAt") && movie && changed.startsAt) {
      const endsAt = new Date(changed.startsAt).getTime() + movie.durationMinutes * 60 * 1000;
      changed.endsAt = toDateTimeInput(endsAt);
    }
    setNewShow(changed);
  };
  const updateEditing = (field) => (event) => setEditing({ ...editing, [field]: event.target.value });

  if (loading) {
    return <Loading />;
  }
  if (!theatre) {
    return (
      <div>
        <Link to="/admin/theatres" className="back-link">
          <ArrowLeft /> My theatres
        </Link>
        <div className="empty-state">
          <Building2 />
          <p>{loadError}</p>
        </div>
      </div>
    );
  }

  // Upcoming shows soonest first, then started and cancelled shows newest first.
  const upcomingShows = shows
    .filter((show) => statusOf(show) === "upcoming")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const otherShows = shows.filter((show) => statusOf(show) !== "upcoming");
  const listedShows = showPast ? [...upcomingShows, ...otherShows] : upcomingShows;

  // One day at a time, like the customer's movie page. Default to the first day from today.
  const dates = [...new Set(listedShows.map((show) => toDateKey(show.startsAt)))].sort();
  const today = toDateKey(new Date());
  const shownDate = dates.includes(selectedDate)
    ? selectedDate
    : (dates.find((dateKey) => dateKey >= today) ?? dates[dates.length - 1]);
  const visibleShows = listedShows.filter((show) => toDateKey(show.startsAt) === shownDate);

  return (
    <div>
      <Link to="/admin/theatres" className="back-link">
        <ArrowLeft /> My theatres
      </Link>
      <div className="page-header">
        <h1>
          {theatre.name}, {theatre.city}
        </h1>
        <p className="muted">Add shows, change timings and prices, and manage seats.</p>
      </div>

      <div className="panel">
        <h3 className="icon-text">
          <CalendarPlus /> Add a show
        </h3>
        <form onSubmit={handleCreate} className="form grid-form">
          <label>
            Movie
            <select value={newShow.movieId} onChange={updateNewShow("movieId")} required>
              <option value="">Choose a movie</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title} ({movie.language}, {movie.durationMinutes} min)
                </option>
              ))}
            </select>
          </label>
          <label>
            Starts at
            <input type="datetime-local" value={newShow.startsAt} onChange={updateNewShow("startsAt")} required />
          </label>
          <label>
            Ends at
            <input type="datetime-local" value={newShow.endsAt} onChange={updateNewShow("endsAt")} required />
          </label>
          <label>
            Price per seat
            <input type="number" min="0" step="0.01" value={newShow.price} onChange={updateNewShow("price")} required />
          </label>
          <label>
            Seat rows
            <input value={newShow.seatRows} onChange={updateNewShow("seatRows")} required />
          </label>
          <label>
            Seats per row
            <input
              type="number"
              min="1"
              max="50"
              value={newShow.seatsPerRow}
              onChange={updateNewShow("seatsPerRow")}
              required
            />
          </label>
          <label>
            Repeat for (days)
            <input
              type="number"
              min="1"
              max={MAX_REPEAT_DAYS}
              value={newShow.repeatDays}
              onChange={updateNewShow("repeatDays")}
              required
            />
          </label>
          <div>
            <button type="submit" disabled={busy}>
              <Plus /> {busy ? "Adding..." : "Add show"}
            </button>
          </div>
        </form>
      </div>

      <div className="section-header">
        <h2 className="icon-text">
          <CalendarDays /> Shows
        </h2>
        <label className="inline-label checkbox-label">
          <input type="checkbox" checked={showPast} onChange={(event) => setShowPast(event.target.checked)} />
          Show started and cancelled shows too
        </label>
      </div>

      {loadError && <Message type="error">{loadError}</Message>}
      {visibleShows.length === 0 ? (
        <div className="empty-state">
          <CalendarDays />
          <p>{showPast ? "This theatre has no shows yet. Add one above." : "No upcoming shows. Add one above."}</p>
        </div>
      ) : (
        <>
          <DateStrip dates={dates} selectedDate={shownDate} onSelect={setSelectedDate} />
          <p className="results-count muted">
            {visibleShows.length} {visibleShows.length === 1 ? "show" : "shows"}
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Starts</th>
                <th>Ends</th>
                <th className="number">Price</th>
                <th className="number">Booked</th>
                {showPast && <th>Status</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleShows.map((show) => {
                const status = statusOf(show);
                if (editing?.id === show.id) {
                  return (
                    <tr key={show.id}>
                      <td>{show.movieTitle}</td>
                      <td>
                        <input type="datetime-local" value={editing.startsAt} onChange={updateEditing("startsAt")} />
                      </td>
                      <td>
                        <input type="datetime-local" value={editing.endsAt} onChange={updateEditing("endsAt")} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={editing.price} onChange={updateEditing("price")} />
                      </td>
                      <td className="number">
                        {show.bookedSeats}/{show.totalSeats}
                      </td>
                      {showPast && (
                        <td>
                          <StatusBadge status={status} />
                        </td>
                      )}
                      <td className="actions">
                        <button onClick={handleSave} disabled={busy}>
                          <Save /> Save
                        </button>
                        <button className="secondary" onClick={() => setEditing(null)}>
                          <X /> Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={show.id} className={status === "upcoming" ? "" : "faded"}>
                    <td>{show.movieTitle}</td>
                    <td>{formatTime(show.startsAt)}</td>
                    <td>{formatTime(show.endsAt)}</td>
                    <td className="number">{formatPrice(show.price)}</td>
                    <td className="number">
                      {show.bookedSeats}/{show.totalSeats}
                    </td>
                    {showPast && (
                      <td>
                        <StatusBadge status={status} />
                      </td>
                    )}
                    <td className="actions">
                      {status === "upcoming" && (
                        <>
                          <button className="secondary" onClick={() => startEditing(show)}>
                            <Pencil /> Edit
                          </button>
                          <button className="secondary" onClick={() => setSeatsShow(show)}>
                            <Armchair /> Seats
                          </button>
                          <button className="danger" onClick={() => handleDelete(show)} disabled={busy}>
                            {show.bookedSeats > 0 ? (
                              <>
                                <Ban /> Cancel show
                              </>
                            ) : (
                              <>
                                <Trash2 /> Delete
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {seatsShow && (
        <ManageSeats
          key={seatsShow.id}
          show={seatsShow}
          run={run}
          busy={busy}
          onChange={loadShows}
          onClose={() => setSeatsShow(null)}
        />
      )}

      <Toasts message={message} error={error} onClose={clear} />
    </div>
  );
};

export default TheatreShows;
