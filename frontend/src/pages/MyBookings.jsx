import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Armchair,
  CalendarClock,
  ChevronDown,
  Download,
  History,
  MapPin,
  Star,
  Ticket,
} from "lucide-react";
import { createReview, downloadTicket, listMyBookings } from "../api/booking";
import useAction from "../hooks/useAction";
import Loading from "../components/Loading";
import ReviewForm from "../components/ReviewForm";
import Message from "../components/Message";
import StatusBadge from "../components/StatusBadge";
import Toasts from "../components/Toasts";
import { formatDateTime, formatPrice } from "../utils/format";

const PAST_PAGE_SIZE = 10;

const isUpcoming = (booking) =>
  booking.status === "confirmed" && new Date(booking.startsAt) > new Date();

// Only a show the customer has actually watched can be reviewed, and only once.
const canReview = (booking) =>
  booking.status === "confirmed" && new Date(booking.endsAt) <= new Date() && !booking.review;

const statusOf = (booking) => {
  if (booking.status === "cancelled") return "cancelled";
  return isUpcoming(booking) ? "confirmed" : "over";
};

// Every upcoming booking is confirmed, so the status badge is only shown for past ones.
// onReview is only passed for past bookings, which are the only ones that can be rated.
const BookingList = ({ bookings, showStatus, onDownload, onReview, busy }) => (
  <div className="booking-list">
    {bookings.map((booking) => (
      <div key={booking.id} className="booking-card">
        <div className="booking-main">
          <div className="booking-title">
            <Link to={`/movies/${booking.movieId}`}>{booking.movieTitle}</Link>
            {showStatus && <StatusBadge status={statusOf(booking)} />}
          </div>
          <div className="meta">
            <span>
              <CalendarClock /> {formatDateTime(booking.startsAt)}
            </span>
            <span>
              <MapPin /> {booking.theatreName}, {booking.theatreCity}
            </span>
            <span>
              <Armchair /> {booking.seats.join(", ")}
            </span>
            {booking.review && (
              <span>
                <Star /> You rated it {booking.review.movieRating} / 5
              </span>
            )}
          </div>
        </div>
        <div className="booking-side">
          <span className="booking-amount">{formatPrice(booking.totalAmount)}</span>
          <span className="muted mono">#{booking.id}</span>
          {booking.status === "confirmed" && (
            <button className="secondary" onClick={() => onDownload(booking.id)} disabled={busy}>
              <Download /> Ticket
            </button>
          )}
          {onReview && canReview(booking) && (
            <button className="secondary" onClick={() => onReview(booking.id)}>
              <Star /> Rate movie
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
);

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pastLimit, setPastLimit] = useState(PAST_PAGE_SIZE);
  const { message, error: actionError, busy, run, clear } = useAction();
  // The booking whose review form is open; only one form is open at a time.
  const [reviewingId, setReviewingId] = useState(null);

  const handleDownload = (bookingId) =>
    run(async () => {
      await downloadTicket(bookingId);
      return { message: "Ticket downloaded" };
    });

  const handleSubmitReview = (bookingId, values) =>
    run(async () => {
      const data = await createReview(bookingId, values);
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? { ...booking, review: data.review } : booking)),
      );
      setReviewingId(null);
      return data;
    });

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await listMyBookings();
        setBookings(data.bookings);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);


  // The backend sends the latest show first; upcoming ones read better soonest first.
  const upcomingBookings = bookings
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const pastBookings = bookings.filter((booking) => !isUpcoming(booking));
  const reviewingBooking = bookings.find((booking) => booking.id === reviewingId);

  return (
    <div>
      <div className="page-header">
        <h1>My bookings</h1>
        <p className="muted">Your tickets are also emailed to you as a PDF after each booking.</p>
      </div>

      {loading && <Loading />}
      {error && <Message type="error">{error}</Message>}
      {!loading && !error && (
        <>
          <h2 className="icon-text">
            <CalendarClock /> Upcoming
          </h2>
          {upcomingBookings.length === 0 ? (
            <div className="empty-state">
              <Ticket />
              <p>No upcoming bookings.</p>
              <Link to="/">Find a movie</Link>
            </div>
          ) : (
            <BookingList bookings={upcomingBookings} onDownload={handleDownload} busy={busy} />
          )}

          <h2 className="icon-text">
            <History /> Past and cancelled
          </h2>
          {pastBookings.length === 0 ? (
            <div className="empty-state">
              <History />
              <p>Nothing here yet.</p>
            </div>
          ) : (
            <>
              <BookingList
                bookings={pastBookings.slice(0, pastLimit)}
                showStatus
                onDownload={handleDownload}
                busy={busy}
                onReview={setReviewingId}
              />
              {pastBookings.length > pastLimit && (
                <div className="load-more">
                  <button className="secondary" onClick={() => setPastLimit(pastLimit + PAST_PAGE_SIZE)}>
                    <ChevronDown /> Show more ({pastBookings.length - pastLimit} left)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {reviewingBooking && (
        <ReviewForm
          booking={reviewingBooking}
          busy={busy}
          onSubmit={(values) => handleSubmitReview(reviewingBooking.id, values)}
          onCancel={() => setReviewingId(null)}
        />
      )}

      <Toasts message={message} error={actionError} onClose={clear} />
    </div>
  );
};

export default MyBookings;
