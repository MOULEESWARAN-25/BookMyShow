const { UniqueConstraintError } = require("sequelize");
const { Booking, Show, Review } = require("../models");
const { parseId } = require("../utils/validation");

const LIKED_ASPECTS = ["Story", "Acting", "Music", "Visuals", "Comedy", "Action"];
const MAX_COMMENT_LENGTH = 500;

const isRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5;

const parseReviewFields = (body) => {
  const { movieRating, theatreRating, likedAspects = [], comment } = body || {};

  if (!isRating(movieRating)) {
    return { error: "Rate the movie from 1 to 5 stars" };
  }
  if (!isRating(theatreRating)) {
    return { error: "Rate the theatre from 1 to 5 stars" };
  }
  if (
    !Array.isArray(likedAspects) ||
    likedAspects.some((aspect) => !LIKED_ASPECTS.includes(aspect)) ||
    new Set(likedAspects).size !== likedAspects.length
  ) {
    return { error: `What you liked must be from: ${LIKED_ASPECTS.join(", ")}` };
  }
  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    return { error: "The review must be text" };
  }
  const text = comment?.trim() || null;
  if (text && text.length > MAX_COMMENT_LENGTH) {
    return { error: `The review can be at most ${MAX_COMMENT_LENGTH} characters` };
  }

  return { values: { movieRating, theatreRating, likedAspects, comment: text } };
};

const reviewJson = (review) => ({
  movieRating: review.movieRating,
  theatreRating: review.theatreRating,
  likedAspects: review.likedAspects,
  comment: review.comment,
});

// A customer rates a show they watched, once. The review is feedback for the theatre owner,
// so it cannot be changed after it is sent.
const createReview = async (req, res) => {
  const bookingId = parseId(req.params.bookingId);
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  const { values, error } = parseReviewFields(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const booking = await Booking.findByPk(bookingId, {
    attributes: ["id", "userId", "status"],
    include: [{ model: Show, attributes: ["endsAt"] }],
  });
  // Someone else's booking gets the same answer as a missing one, so ids cannot be probed.
  if (!booking || booking.userId !== req.user.userId) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.status === "cancelled") {
    return res.status(409).json({ message: "This booking was cancelled, so it cannot be reviewed" });
  }
  if (booking.Show.endsAt > new Date()) {
    return res.status(409).json({ message: "You can review the movie after the show ends" });
  }

  // The unique booking_id in the database is what stops a second review, even if two
  // requests arrive at the same moment.
  let review;
  try {
    review = await Review.create({ bookingId, ...values });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ message: "You have already reviewed this show" });
    }
    throw error;
  }

  res.status(201).json({ message: "Thanks for your review", review: reviewJson(review) });
};

module.exports = { createReview };
