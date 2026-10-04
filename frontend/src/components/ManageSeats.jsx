import { useEffect, useRef, useState } from "react";
import { Armchair, Plus, X } from "lucide-react";
import { getSeats, addSeats, deleteSeat } from "../api/show";
import { formatDateTime } from "../utils/format";
import { parseSeatRows } from "../utils/seatRows";
import Loading from "./Loading";
import Message from "./Message";
import SeatMap from "./SeatMap";

// `run` and `busy` come from the page's useAction, so seat messages show in the same place as the rest.
const ManageSeats = ({ show, run, busy, onChange, onClose }) => {
  const [seats, setSeats] = useState([]);
  const [seatRows, setSeatRows] = useState("");
  const [seatsPerRow, setSeatsPerRow] = useState("10");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const panelRef = useRef(null);

  const loadSeats = async () => {
    try {
      const data = await getSeats(show.id);
      setSeats(data.seats);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeats();
    panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [show.id]);

  const afterChange = async () => {
    await loadSeats();
    onChange();
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    const data = await run(() => addSeats(show.id, parseSeatRows(seatRows), Number(seatsPerRow)));
    if (data) {
      setSeatRows("");
      await afterChange();
    }
  };

  const handleSeatClick = async (seatNumber) => {
    if (!window.confirm(`Remove seat ${seatNumber}?`)) return;

    const data = await run(() => deleteSeat(show.id, seatNumber));
    if (data) {
      await afterChange();
    }
  };

  return (
    <div className="panel" ref={panelRef}>
      <div className="panel-header">
        <div>
          <h3 className="icon-text">
            <Armchair /> Seats for {show.movieTitle}
          </h3>
          <p className="muted">
            {formatDateTime(show.startsAt)}. Click an available seat to remove it. Booked seats cannot be removed.
          </p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close seats" title="Close">
          <X />
        </button>
      </div>

      {loading && <Loading />}
      {loadError && <Message type="error">{loadError}</Message>}
      {!loading && !loadError && <SeatMap seats={seats} onSeatClick={handleSeatClick} />}

      <form onSubmit={handleAdd} className="search-bar">
        <input
          placeholder="Rows to add, e.g. F, G"
          value={seatRows}
          onChange={(event) => setSeatRows(event.target.value)}
          required
        />
        <label className="inline-label">
          Seats per row
          <input
            type="number"
            min="1"
            max="50"
            value={seatsPerRow}
            onChange={(event) => setSeatsPerRow(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          <Plus /> Add seats
        </button>
      </form>
    </div>
  );
};

export default ManageSeats;
