import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Clapperboard, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { listMyMovies, createMovie, updateMovie, deleteMovie } from "../../api/movie";
import useAction from "../../hooks/useAction";
import MovieForm from "../../components/MovieForm";
import Loading from "../../components/Loading";
import Message from "../../components/Message";
import Toasts from "../../components/Toasts";
import { formatDate } from "../../utils/format";

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { message, error, busy, run, clear } = useAction();

  const loadMovies = async () => {
    try {
      const data = await listMyMovies();
      setMovies(data.movies);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const startEditing = (movie) => {
    setEditing(movie);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async (movie) => {
    const data = await run(() => createMovie(movie));
    if (data) {
      await loadMovies();
    }
    return data;
  };

  const handleUpdate = async (movie) => {
    const data = await run(() => updateMovie(editing.id, movie));
    if (data) {
      setEditing(null);
      await loadMovies();
    }
    return data;
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Delete ${movie.title}?`)) return;

    const data = await run(() => deleteMovie(movie.id));
    if (data) {
      await loadMovies();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manage movies</h1>
        <p className="muted">
          Any theatre owner can add shows for your movies, but only you can edit or delete them.
        </p>
      </div>

      <div className="panel">
        {editing ? (
          <>
            <h3 className="icon-text">
              <Pencil /> Edit {editing.title}
            </h3>
            <MovieForm
              key={editing.id}
              movie={editing}
              submitLabel="Save changes"
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </>
        ) : (
          <>
            <h3 className="icon-text">
              <Plus /> Add a movie
            </h3>
            <MovieForm submitLabel="Add movie" onSubmit={handleCreate} />
          </>
        )}
      </div>

      <h2 className="icon-text">
        <Clapperboard /> Movies you added
      </h2>
      {loading && <Loading />}
      {loadError && <Message type="error">{loadError}</Message>}
      {!loading && !loadError && movies.length === 0 && (
        <div className="empty-state">
          <Clapperboard />
          <p>You have not added any movies yet.</p>
        </div>
      )}
      {movies.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Language</th>
              <th>Genre</th>
              <th>Duration</th>
              <th>Release date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
                </td>
                <td>{movie.language}</td>
                <td>{movie.genre}</td>
                <td>{movie.durationMinutes} min</td>
                <td>{movie.releaseDate ? formatDate(movie.releaseDate) : "-"}</td>
                <td>
                  {movie.upcomingShows > 0 ? (
                    <span className="badge success" title="Customers can see and book this movie">
                      <CalendarClock /> {movie.upcomingShows} upcoming {movie.upcomingShows === 1 ? "show" : "shows"}
                    </span>
                  ) : (
                    <span className="badge" title="Customers only see movies that have upcoming shows">
                      <EyeOff /> Hidden, no shows
                    </span>
                  )}
                </td>
                <td className="actions">
                  <button className="secondary" onClick={() => startEditing(movie)}>
                    <Pencil /> Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(movie)} disabled={busy}>
                    <Trash2 /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Toasts message={message} error={error} onClose={clear} />
    </div>
  );
};

export default Movies;
