import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  Download,
  IndianRupee,
  LogIn,
  MapPin,
  Ticket,
} from "lucide-react";
import { getMovie, listShows } from "../api/movie";
import { getSeats } from "../api/show";
import { createBooking, downloadTicket } from "../api/booking";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import Message from "../components/Message";
import SeatMap from "../components/SeatMap";
import { formatDateTime, formatPrice } from "../utils/format";

// The backend refuses more than this; checking here too tells the user straight away.
const MAX_SEATS_PER_BOOKING = 10;

const BookSeats = () => {
  const { movieId, showId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  // The movie page passes its chosen day and filters, so "Back to shows" returns to the same view.
  const showsLink = `/movies/${movieId}${location.state?.showsSearch ?? ""}`;
  const [movie, setMovie] = useState(null);
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  // Seats chosen before logging in come back through the login page.
  const [selectedSeats, setSelectedSeats] = useState(location.state?.seats ?? []);
  // One key per seat selection: if the same booking is sent twice, the backend books it only once.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSeats = async () => {
    const data = await getSeats(showId);
    setSeats(data.seats);
    // Drop any chosen seat that someone else has booked in the meantime.
    const available = new Set(
      data.seats.filter((seat) => seat.status === "available").map((seat) => seat.seatNumber),
    );
    setSelectedSeats((current) => current.filter((seatNumber) => available.has(seatNumber)));
  };

  useEffect(() => {
    // If the user opens another show before this one loads, ignore this older answer.
    let ignore = false;

    const loadPage = async () => {
      try {
        const [movieData, showsData] = await Promise.all([getMovie(movieId), listShows(movieId)]);
        if (ignore) return;
        const currentShow = showsData.shows.find((item) => item.id === Number(showId));
        if (!currentShow) {
          setError("This show is not available for booking. It may have started or been cancelled.");
          return;
        }
        setMovie(movieData.movie);
        setShow(currentShow);
        await loadSeats();
      } catch (error) {
        if (!ignore) setError(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadPage();

    return () => {
      ignore = true;
    };
  }, [movieId, showId]);

  const toggleSeat = (seatNumber) => {
    if (!selectedSeats.includes(seatNumber) && selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
      setBookingError(`You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`);
      return;
    }
    setSelectedSeats((current) =>
      current.includes(seatNumber)
        ? current.filter((seat) => seat !== seatNumber)
        : [...current, seatNumber],
    );
    setIdempotencyKey(crypto.randomUUID());
    setBookingError("");
  };

  const handleDownload = async () => {
    try {
      await downloadTicket(booking.id);
    } catch (error) {
      setBookingError(error.message);
    }
  };

  const handleBook = async () => {
    setBookingError("");
    setSubmitting(true);
    try {
      const data = await createBooking(show.id, selectedSeats, idempotencyKey);
      setBooking(data.booking);
      setSelectedSeats([]);
      setIdempotencyKey(crypto.randomUUID());
    } catch (error) {
      setBookingError(error.message);
    }
    // Reload either way: after a success our seats show as booked, and after a
    // "seat already booked" error the user sees what someone else just took.
    try {
      await loadSeats();
    } catch (error) {
      setBookingError(error.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return (
      <div>
        <Link to={showsLink} className="back-link">
          <ArrowLeft /> Back to shows
        </Link>
        <div className="empty-state">
          <Ticket />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const totalAmount = show.price * selectedSeats.length;

  return (
    <div>
      <Link to={showsLink} className="back-link">
        <ArrowLeft /> Back to shows
      </Link>
      <div className="page-header">
        <h1>{movie.title}</h1>
        <div className="meta">
          <span>
            <MapPin /> {show.theatre.name}, {show.theatre.city}
          </span>
          <span>
            <CalendarClock /> {formatDateTime(show.startsAt)}
          </span>
          <span>
            <IndianRupee /> {formatPrice(show.price)} per seat
          </span>
        </div>
      </div>

      {booking && (
        <div className="notice success">
          <CircleCheck />
          <div>
            <strong>Booking #{booking.id} confirmed.</strong> Seats {booking.seats.join(", ")}, total{" "}
            {formatPrice(booking.totalAmount)}. Your ticket is also on its way to your email.
            <div className="notice-actions">
              <button onClick={handleDownload}>
                <Download /> Download ticket
              </button>
              <Link to="/bookings" className="button-link">
                <Ticket /> My bookings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Admins can look at the seats but cannot book them. */}
      <SeatMap
        seats={seats}
        selectedSeats={user?.role === "admin" ? undefined : selectedSeats}
        onSeatClick={user?.role === "admin" ? null : toggleSeat}
      />

      <div className="booking-bar">
        <div>
          {user?.role === "admin"
            ? `${seats.filter((seat) => seat.status === "available").length} of ${seats.length} seats available`
            : selectedSeats.length === 0
              ? "Select seats to book"
              : `${selectedSeats.length} ${selectedSeats.length === 1 ? "seat" : "seats"}: ${selectedSeats.join(", ")} · Total ${formatPrice(totalAmount)}`}
        </div>

        {!user && (
          <Link
            to="/login"
            state={{
              from: location.pathname,
              returnState: { seats: selectedSeats, showsSearch: location.state?.showsSearch },
            }}
            className="button-link"
          >
            <LogIn /> Login to book
          </Link>
        )}
        {user?.role === "admin" && <span className="muted">Admins cannot book tickets</span>}
        {user?.role === "user" && (
          <button onClick={handleBook} disabled={selectedSeats.length === 0 || submitting}>
            <Ticket /> {submitting ? "Booking..." : "Book seats"}
          </button>
        )}
      </div>
      {bookingError && <Message type="error">{bookingError}</Message>}
    </div>
  );
};

export default BookSeats;
