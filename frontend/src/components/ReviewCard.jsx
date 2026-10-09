import { Building2, Heart, MessageSquareText, Star, User } from "lucide-react";
import { formatDateTime } from "../utils/format";

// One customer's review, as the theatre owner sees it in the Reviews tab.
const ReviewCard = ({ review }) => (
  <div className="feedback-card">
    <h3>{review.movie}</h3>
    <p className="muted feedback-show">
      {review.theatre} · {formatDateTime(review.startsAt)}
    </p>
    <p>
      <User />
      <strong>Customer:</strong> {review.customerName}
    </p>
    <p>
      <Star />
      <strong>Movie rating:</strong> {review.movieRating} / 5
    </p>
    <p>
      <Heart />
      <strong>Liked:</strong> {review.likedAspects.length > 0 ? review.likedAspects.join(", ") : "Nothing picked"}
    </p>
    <p>
      <Building2 />
      <strong>Theatre rating:</strong> {review.theatreRating} / 5
    </p>
    {review.comment && (
      <p>
        <MessageSquareText />
        <strong>Review:</strong> {review.comment}
      </p>
    )}
  </div>
);

export default ReviewCard;
