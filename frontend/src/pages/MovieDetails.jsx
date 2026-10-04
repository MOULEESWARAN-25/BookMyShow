import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarX,
  Clapperboard,
  MapPin,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Users,
  X,
} from "lucide-react";
import { getMovie, listShows } from "../api/movie";
import DateStrip from "../components/DateStrip";
import FilterSelect from "../components/FilterSelect";
import Loading from "../components/Loading";
import MovieMeta from "../components/MovieMeta";
import { formatPrice, formatTime, toDateKey } from "../utils/format";
import { groupBy, toOptions } from "../utils/group";

const TIMES_OF_DAY = [
  { key: "morning", label: "Morning", icon: Sunrise, fromHour: 0, toHour: 12 },
  { key: "afternoon", label: "Afternoon", icon: Sun, fromHour: 12, toHour: 16 },
  { key: "evening", label: "Evening", icon: Sunset, fromHour: 16, toHour: 20 },
  { key: "night", label: "Night", icon: Moon, fromHour: 20, toHour: 24 },
];

const timeOfDayOf = (value) => {
  const hour = new Date(value).getHours();
  return TIMES_OF_DAY.find((time) => hour >= time.fromHour && hour < time.toHour).key;
};

// Customers see shows for this many days, starting today. The days are worked out from
// today's date on every visit, so the window moves forward by itself each day.
const BOOKING_DAYS = 7;

const nextDays = () => {
  const today = new Date();
  return Array.from({ length: BOOKING_DAYS }, (_, index) =>
    toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)),
  );
};

// Fewer than this share of seats left shows the time as "Filling fast".
const FILLING_FAST_SHARE = 0.25;

const availabilityOf = (show) => {
  if (show.availableSeats === 0) return "sold-out";
  if (show.availableSeats / show.totalSeats < FILLING_FAST_SHARE) return "filling-fast";
  return "available";
};

const MovieDetails = () => {
  const { movieId } = useParams();
  // The chosen day and filters live in the URL, so Back from the seat page keeps them.
  const [searchParams, setSearchParams] = useSearchParams();
  const city = searchParams.get("city") ?? "";
  const theatreId = searchParams.get("theatre") ?? "";
  const timeOfDay = searchParams.get("time") ?? "";

  const [movie, setMovie] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Opening another movie reuses this page, so start clean.
    setMovie(null);
    setError("");
    let ignore = false;

    const loadMovie = async () => {
      try {
        const [movieData, showsData] = await Promise.all([getMovie(movieId), listShows(movieId)]);
        if (ignore) return;
        setMovie(movieData.movie);
        setTheatres(movieData.theatres);
        setShows(showsData.shows);
      } catch (error) {
        if (!ignore) setError(error.message);
      }
    };
    loadMovie();

    return () => {
      ignore = true;
    };
  }, [movieId]);

  // Changes one value in the URL and keeps the others.
  const updateParams = (changes) => {
    const params = new URLSearchParams(searchParams);
    for (const [name, value] of Object.entries(changes)) {
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
    }
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => updateParams({ city: "", theatre: "", time: "" });

  if (error) {
    return (
      <div>
        <Link to="/" className="back-link">
          <ArrowLeft /> All movies
        </Link>
        <div className="empty-state">
          <Clapperboard />
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!movie) {
    return <Loading />;
  }

  // All of a movie's shows are loaded once; only the next 7 days are offered, and the filters
  // and the day pick from those here.
  const days = nextDays();
  const weekShows = shows.filter((show) => days.includes(toDateKey(show.startsAt)));
  const weekTheatres = theatres.filter((theatre) => weekShows.some((show) => show.theatre.id === theatre.id));
  const filteredShows = weekShows.filter(
    (show) =>
      (!city || show.theatre.city === city) &&
      (!theatreId || show.theatre.id === Number(theatreId)) &&
      (!timeOfDay || timeOfDayOf(show.startsAt) === timeOfDay),
  );
  const dates = [...new Set(filteredShows.map((show) => toDateKey(show.startsAt)))];
  const requestedDate = searchParams.get("date");
  const selectedDate = dates.includes(requestedDate) ? requestedDate : dates[0];
  const dayShows = filteredShows.filter((show) => toDateKey(show.startsAt) === selectedDate);
  const showsByTheatre = groupBy(dayShows, (show) => show.theatre.id).sort(([, a], [, b]) =>
    a[0].theatre.name.localeCompare(b[0].theatre.name),
  );
  const theatreOptions = weekTheatres
    .filter((theatre) => !city || theatre.city === city)
    .map((theatre) => ({ value: String(theatre.id), label: theatre.name }));
  const cityOptions = toOptions(weekTheatres.map((theatre) => theatre.city));
  // Only offer the times of day that have shows in the chosen city and theatre.
  const placeShows = weekShows.filter(
    (show) =>
      (!city || show.theatre.city === city) && (!theatreId || show.theatre.id === Number(theatreId)),
  );
  const timesOfDay = TIMES_OF_DAY.filter(
    (time) => time.key === timeOfDay || placeShows.some((show) => timeOfDayOf(show.startsAt) === time.key),
  );
  const isFiltered = Boolean(city || theatreId || timeOfDay);
  // A filter with only one choice cannot narrow anything down, so it is hidden.
  const showCityFilter = cityOptions.length > 1 || city;
  const showTheatreFilter = theatreOptions.length > 1 || theatreId;
  const showTimeFilter = timesOfDay.length > 1 || timeOfDay;

  return (
    <div>
      <Link to="/" className="back-link">
        <ArrowLeft /> All movies
      </Link>
      <div className="panel movie-hero">
        <h1>{movie.title}</h1>
        <MovieMeta movie={movie} />
        {movie.description && <p>{movie.description}</p>}
        {movie.castMembers?.length > 0 && (
          <p className="icon-text">
            <Users /> {movie.castMembers.join(", ")}
          </p>
        )}
      </div>

      <h2>Shows</h2>

      {weekShows.length === 0 ? (
        <div className="empty-state">
          <CalendarX />
          <p>No shows for this movie in the next {BOOKING_DAYS} days.</p>
        </div>
      ) : (
        <>
          {(showCityFilter || showTheatreFilter || showTimeFilter) && (
            <div className="filters">
              {showCityFilter && (
                <FilterSelect
                  icon={MapPin}
                  label="City"
                  allLabel="All cities"
                  value={city}
                  options={cityOptions}
                  onChange={(value) => updateParams({ city: value, theatre: "" })}
                />
              )}
              {showTheatreFilter && (
                <FilterSelect
                  icon={Building2}
                  label="Theatre"
                  allLabel="All theatres"
                  value={theatreId}
                  options={theatreOptions}
                  onChange={(value) => updateParams({ theatre: value })}
                />
              )}
              {showTimeFilter && (
                <div className="chips" role="group" aria-label="Time of day">
                  {timesOfDay.map((time) => (
                    <button
                      key={time.key}
                      className={timeOfDay === time.key ? "chip active" : "chip"}
                      aria-pressed={timeOfDay === time.key}
                      onClick={() => updateParams({ time: timeOfDay === time.key ? "" : time.key })}
                    >
                      <time.icon /> {time.label}
                    </button>
                  ))}
                </div>
              )}
              {isFiltered && (
                <button className="secondary" onClick={clearFilters}>
                  <X /> Clear filters
                </button>
              )}
            </div>
          )}

          {dates.length === 0 ? (
            <div className="empty-state">
              <CalendarX />
              <p>No shows match these filters.</p>
            </div>
          ) : (
            <>
              <DateStrip
                dates={days}
                availableDates={dates}
                selectedDate={selectedDate}
                onSelect={(dateKey) => updateParams({ date: dateKey })}
              />

              <div className="shows-summary">
                <p className="results-count muted">
                  {dayShows.length} {dayShows.length === 1 ? "show" : "shows"} in {showsByTheatre.length}{" "}
                  {showsByTheatre.length === 1 ? "theatre" : "theatres"}
                </p>
                <div className="availability-legend">
                  <span>
                    <i className="dot available" /> Available
                  </span>
                  <span>
                    <i className="dot filling-fast" /> Filling fast
                  </span>
                  <span>
                    <i className="dot sold-out" /> Sold out
                  </span>
                </div>
              </div>

              {showsByTheatre.map(([id, theatreShows]) => (
                <div key={id} className="theatre-shows">
                  <div className="theatre-name icon-text">
                    <MapPin />
                    <span>
                      {theatreShows[0].theatre.name}
                      <span className="muted">, {theatreShows[0].theatre.city}</span>
                    </span>
                  </div>
                  <div className="show-times">
                    {theatreShows.map((show) => {
                      const availability = availabilityOf(show);
                      if (availability === "sold-out") {
                        return (
                          <span key={show.id} className="show-time sold-out">
                            {formatTime(show.startsAt)}
                            <small>Sold out</small>
                          </span>
                        );
                      }
                      return (
                        <Link
                          key={show.id}
                          to={`/movies/${movie.id}/shows/${show.id}`}
                          state={{ showsSearch: `?${searchParams.toString()}` }}
                          className={`show-time ${availability}`}
                          title={`${show.availableSeats} of ${show.totalSeats} seats left`}
                        >
                          {formatTime(show.startsAt)}
                          <small>{formatPrice(show.price)}</small>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MovieDetails;
