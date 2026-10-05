import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  Clapperboard,
  Languages,
  MapPin,
  Search,
  Tag,
  X,
} from "lucide-react";
import { listMovies } from "../api/movie";
import FilterSelect from "../components/FilterSelect";
import Message from "../components/Message";
import MovieMeta from "../components/MovieMeta";
import { toOptions } from "../utils/group";

const SEARCH_DELAY_MS = 400;

const MovieList = () => {
  // Search and filters live in the URL (/?search=leo&city=Chennai), so Back and shared links keep them.
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const city = searchParams.get("city") ?? "";
  const theatreId = searchParams.get("theatre") ?? "";
  const language = searchParams.get("language") ?? "";
  const genre = searchParams.get("genre") ?? "";

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Keep the box in step with the URL, for example after clicking "Movies" in the header.
    setSearch(searchQuery);

    // If a newer search starts before this one finishes, ignore this older response.
    let ignore = false;

    const loadMovies = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listMovies(searchQuery);
        if (!ignore) setMovies(data.movies);
      } catch (error) {
        if (!ignore) setError(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadMovies();

    return () => {
      ignore = true;
    };
  }, [searchQuery]);

  // Changes some values in the URL and keeps the others. It starts from the current URL
  // (current), so a search that fires late does not undo a filter picked in the meantime.
  const updateParams = (changes, options) => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      for (const [name, value] of Object.entries(changes)) {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      }
      return params;
    }, options);
  };

  // Search while typing: every key press restarts the timer, so the search runs once the user pauses.
  // replace: true keeps each half-typed word out of the browser's Back history.
  useEffect(() => {
    if (search.trim() === searchQuery) return;

    const timer = setTimeout(
      () => updateParams({ search: search.trim() }, { replace: true }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  // Pressing Enter searches straight away instead of waiting for the timer.
  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ search: search.trim() }, { replace: true });
  };

  const clearAll = () => {
    setSearch("");
    setSearchParams({});
  };

  // Search runs on the server (OpenSearch); the filters run here on the loaded list, so they are instant.
  const visibleMovies = movies.filter(
    (movie) =>
      (!city || movie.cities.includes(city)) &&
      (!theatreId ||
        movie.theatres.some((theatre) => theatre.id === Number(theatreId))) &&
      (!language || movie.language === language) &&
      (!genre || movie.genre === genre),
  );
  const isFiltered = Boolean(
    searchQuery || city || theatreId || language || genre,
  );

  const theatres = new Map();
  for (const theatre of movies.flatMap((movie) => movie.theatres)) {
    if (!city || theatre.city === city) {
      theatres.set(theatre.id, theatre);
    }
  }
  const theatreOptions = [...theatres.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((theatre) => ({
      value: String(theatre.id),
      label: city ? theatre.name : `${theatre.name}, ${theatre.city}`,
    }));

  return (
    <div>
      <div className="page-header">
        <h1>Movies</h1>
        <p className="muted">Movies with upcoming shows you can book.</p>
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="search-form">
          <label className="input-with-icon">
            <Search />
            <input
              type="search"
              placeholder="Search by title, actor or story"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </form>

        <div className="filters">
          <FilterSelect
            icon={MapPin}
            label="City"
            allLabel="All cities"
            value={city}
            options={toOptions(
              [...movies.flatMap((movie) => movie.cities), city].filter(
                Boolean,
              ),
            )}
            onChange={(value) => updateParams({ city: value, theatre: "" })}
          />
          <FilterSelect
            icon={Building2}
            label="Theatre"
            allLabel="All theatres"
            value={theatreId}
            options={theatreOptions}
            onChange={(value) => updateParams({ theatre: value })}
          />
          <FilterSelect
            icon={Languages}
            label="Language"
            allLabel="All languages"
            value={language}
            options={toOptions(
              [...movies.map((movie) => movie.language), language].filter(
                Boolean,
              ),
            )}
            onChange={(value) => updateParams({ language: value })}
          />
          <FilterSelect
            icon={Tag}
            label="Genre"
            allLabel="All genres"
            value={genre}
            options={toOptions(
              [...movies.map((movie) => movie.genre), genre].filter(Boolean),
            )}
            onChange={(value) => updateParams({ genre: value })}
          />
          {isFiltered && (
            <button type="button" className="secondary" onClick={clearAll}>
              <X /> Clear all
            </button>
          )}
        </div>
      </div>

      {error && <Message type="error">{error}</Message>}

      {loading && (
        <div className="movie-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="movie-card skeleton" />
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="results-count muted">
          {visibleMovies.length === movies.length
            ? `${movies.length} ${movies.length === 1 ? "movie" : "movies"}`
            : `${visibleMovies.length} of ${movies.length} movies`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {!loading && !error && visibleMovies.length === 0 && (
        <div className="empty-state">
          <Clapperboard />
          <p>
            {isFiltered
              ? "No movies match your search and filters."
              : "No movies are showing right now."}
          </p>
        </div>
      )}

      {!loading && visibleMovies.length > 0 && (
        <div className="movie-grid">
          {visibleMovies.map((movie) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}`}
              className="movie-card"
            >
              <h3>{movie.title}</h3>
              <MovieMeta movie={movie} showRelease={false} />
              <p className="movie-cities">
                <MapPin /> {movie.cities.join(", ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieList;
