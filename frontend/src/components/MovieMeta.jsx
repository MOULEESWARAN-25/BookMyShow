import { CalendarDays, Clock, Languages, Tag } from "lucide-react";
import { formatDate } from "../utils/format";

// The movie list leaves out the release date (showRelease={false}) to keep its cards short;
// the movie's own page shows it.
const MovieMeta = ({ movie, showRelease = true }) => (
  <div className="meta">
    <span>
      <Languages /> {movie.language}
    </span>
    <span>
      <Tag /> {movie.genre}
    </span>
    <span>
      <Clock /> {movie.durationMinutes} min
    </span>
    {showRelease && movie.releaseDate && (
      <span>
        <CalendarDays /> {new Date(movie.releaseDate) > new Date() ? "Releases" : "Released"}{" "}
        {formatDate(movie.releaseDate)}
      </span>
    )}
  </div>
);

export default MovieMeta;
