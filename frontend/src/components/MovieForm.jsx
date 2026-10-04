import { useState } from "react";
import { Plus, Save, X } from "lucide-react";

const toFields = (movie) => ({
  title: movie?.title ?? "",
  description: movie?.description ?? "",
  language: movie?.language ?? "",
  genre: movie?.genre ?? "",
  durationMinutes: movie ? String(movie.durationMinutes) : "",
  releaseDate: movie?.releaseDate ?? "",
  castMembers: movie?.castMembers?.join(", ") ?? "",
});

// Turns the text inputs into the JSON the movie API expects.
const toMovie = (fields) => {
  const castMembers = fields.castMembers
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    title: fields.title,
    description: fields.description || null,
    language: fields.language,
    genre: fields.genre,
    durationMinutes: Number(fields.durationMinutes),
    releaseDate: fields.releaseDate || null,
    castMembers: castMembers.length > 0 ? castMembers : null,
  };
};

const MovieForm = ({ movie, submitLabel, onSubmit, onCancel }) => {
  const [fields, setFields] = useState(toFields(movie));
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => setFields({ ...fields, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const saved = await onSubmit(toMovie(fields));
    setSubmitting(false);
    if (saved && !movie) {
      setFields(toFields(null));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form grid-form">
      <label className="span-2">
        Title
        <input value={fields.title} onChange={updateField("title")} required />
      </label>
      <label>
        Language
        <input value={fields.language} onChange={updateField("language")} required />
      </label>
      <label>
        Genre
        <input value={fields.genre} onChange={updateField("genre")} required />
      </label>
      <label>
        Duration (minutes)
        <input type="number" min="1" value={fields.durationMinutes} onChange={updateField("durationMinutes")} required />
      </label>
      <label>
        Release date
        <input type="date" value={fields.releaseDate} onChange={updateField("releaseDate")} />
      </label>
      <label className="span-2">
        Cast (comma separated)
        <input value={fields.castMembers} onChange={updateField("castMembers")} />
      </label>
      <label className="full-width">
        Description
        <textarea rows="3" value={fields.description} onChange={updateField("description")} />
      </label>
      <div className="actions">
        <button type="submit" disabled={submitting}>
          {movie ? <Save /> : <Plus />} {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            <X /> Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default MovieForm;
