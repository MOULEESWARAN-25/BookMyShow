import { formatPrice } from "../utils/format";

const MetricsTable = ({ rows, labelColumns }) => {
  if (rows.length === 0) {
    return <p className="muted">No shows in these dates.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          {labelColumns.map((column) => (
            <th key={column.key}>{column.title}</th>
          ))}
          <th className="number">Shows</th>
          <th className="number">Bookings</th>
          <th className="number">Tickets</th>
          <th className="number">Capacity</th>
          <th className="number">Occupancy</th>
          <th className="number">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {labelColumns.map((column) => (
              <td key={column.key}>
                {column.format
                  ? column.format(row[column.key])
                  : row[column.key]}
              </td>
            ))}
            <td className="number">{row.shows}</td>
            <td className="number">{row.bookings}</td>
            <td className="number">{row.tickets}</td>
            <td className="number">{row.capacity}</td>
            <td className="number">{row.occupancyPercent}%</td>
            <td className="number">{formatPrice(row.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MetricsTable;
