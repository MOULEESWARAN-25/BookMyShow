import { splitSeatNumber } from "../utils/format";
import { groupBy } from "../utils/group";

const sortRows = (a, b) => a.length - b.length || a.localeCompare(b);

// Without onSeatClick the map is view only, for example for admins looking at a show.
// Without selectedSeats nothing can be selected (the admin's seat manager), so the legend leaves "Selected" out.
const SeatMap = ({ seats, selectedSeats, onSeatClick }) => {
  const rows = groupBy(seats, (seat) => splitSeatNumber(seat.seatNumber).row).sort(
    ([rowA], [rowB]) => sortRows(rowA, rowB),
  );

  if (seats.length === 0) {
    return <p className="muted">This show has no seats yet.</p>;
  }

  return (
    <div className="seat-map">
      <div className="screen">Screen this way</div>
      {rows.map(([row, rowSeats]) => (
        <div key={row} className="seat-row">
          <span className="row-label">{row}</span>
          {rowSeats
            .sort((a, b) => splitSeatNumber(a.seatNumber).number - splitSeatNumber(b.seatNumber).number)
            .map((seat) => {
              const isBooked = seat.status === "booked";
              const isSelected = selectedSeats?.includes(seat.seatNumber);
              return (
                <button
                  key={seat.seatNumber}
                  className={`seat ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                  disabled={isBooked || !onSeatClick}
                  title={isBooked ? `${seat.seatNumber} (booked)` : seat.seatNumber}
                  onClick={() => onSeatClick(seat.seatNumber)}
                >
                  {splitSeatNumber(seat.seatNumber).number}
                </button>
              );
            })}
        </div>
      ))}

      <div className="seat-legend">
        <span>
          <span className="seat sample" /> Available
        </span>
        {selectedSeats && (
          <span>
            <span className="seat sample selected" /> Selected
          </span>
        )}
        <span>
          <span className="seat sample booked" /> Booked
        </span>
      </div>
    </div>
  );
};

export default SeatMap;
