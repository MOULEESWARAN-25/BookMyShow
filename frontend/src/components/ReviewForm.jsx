import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { formatDateTime } from "../utils/format";

const LIKED_ASPECTS = ["Story", "Acting", "Music", "Visuals", "Comedy", "Action"];
const MAX_REVIEW_LENGTH = 500;

const StarIcon = () => (
  <svg className="star-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z" />
  </svg>
);

// The five star buttons, written once and used for both the movie and the theatre.
const StarRating = ({ label, value, onChange }) => (
  <div className="rating" role="group" aria-label={label}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={value >= star ? "star selected" : "star"}
        onClick={() => onChange(star)}
        aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
        aria-pressed={value === star}
      >
        <StarIcon />
      </button>
    ))}
  </div>
);

// Opens as a popup over My bookings once a show has ended. The customer is logged in and the
// booking says which movie, theatre and show it was, so the form only asks about the experience.
// A review is sent once and cannot be changed afterwards.
const ReviewForm = ({ booking, onSubmit, onCancel, busy }) => {
  const dialogRef = useRef(null);
  const [review, setReview] = useState("");
  const [movieRating, setMovieRating] = useState(0);
  const [likedAspects, setLikedAspects] = useState([]);
  const [theatreRating, setTheatreRating] = useState(0);
  const [error, setError] = useState("");

  // Picking a star fixes the "rate both" error, so it goes away straight away.
  const rateMovie = (rating) => {
    setMovieRating(rating);
    setError("");
  };

  const rateTheatre = (rating) => {
    setTheatreRating(rating);
    setError("");
  };

  const toggleLikedAspect = (aspect) => {
    setLikedAspects((currentAspects) =>
      currentAspects.includes(aspect)
        ? currentAspects.filter((currentAspect) => currentAspect !== aspect)
        : [...currentAspects, aspect],
    );
  };

  // <dialog> is the browser's own popup: showModal() dims the page behind it, keeps the keyboard
  // inside it, and closes it on Esc (which fires onClose).
  useEffect(() => {
    dialogRef.current.showModal();
  }, []);

  // A click on the dimmed area outside the box lands on the dialog itself, so it closes the popup.
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onCancel();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!movieRating || !theatreRating) {
      setError("Rate both the movie and the theatre before submitting.");
      return;
    }
    setError("");
    onSubmit({ movieRating, likedAspects, theatreRating, comment: review });
  };

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      onClose={onCancel}
      onClick={handleBackdropClick}
      aria-labelledby="review-title"
    >
      <form className="review-form" onSubmit={handleSubmit}>
        <div className="review-form-header">
          <div>
            <h3 id="review-title">Share your comments</h3>
            <p className="muted">
              {booking.movieTitle} · {booking.theatreName} · {formatDateTime(booking.startsAt)}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="review-field">
          <label>How was the movie? *</label>
          <StarRating label="Movie rating" value={movieRating} onChange={rateMovie} />
        </div>

        <div className="review-field">
          <label>What did you like?</label>
          <div className="chips">
            {LIKED_ASPECTS.map((aspect) => (
              <button
                key={aspect}
                type="button"
                className={likedAspects.includes(aspect) ? "chip active" : "chip"}
                aria-pressed={likedAspects.includes(aspect)}
                onClick={() => toggleLikedAspect(aspect)}
              >
                {aspect}
              </button>
            ))}
          </div>
        </div>

        <div className="review-field">
          <label>How was the theatre? *</label>
          <p className="muted">Seats, sound, screen and cleanliness.</p>
          <StarRating label="Theatre rating" value={theatreRating} onChange={rateTheatre} />
        </div>

        <div className="review-field">
          <label htmlFor={`review-${booking.id}`}>Write a review</label>
          <p className="muted">Optional. The theatre owner will see it.</p>
          <textarea
            id={`review-${booking.id}`}
            rows={4}
            maxLength={MAX_REVIEW_LENGTH}
            onChange={(event) => setReview(event.target.value)}
            placeholder="Write your review"
            value={review}
          />
          <p className="muted review-count">
            {review.length} / {MAX_REVIEW_LENGTH}
          </p>
        </div>

        {error && <p className="review-error">{error}</p>}

        <div className="review-actions">
          <p className="muted review-note">You can't change your review after submitting.</p>
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
            Not now
          </button>
          <button type="submit" disabled={busy}>
            <Send /> Submit
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default ReviewForm;
