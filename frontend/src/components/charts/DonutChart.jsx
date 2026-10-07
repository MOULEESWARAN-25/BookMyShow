import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

const MAX_SLICES = 6;
const SIZE = 180;

// More than 6 slices cannot be told apart, so the smallest ones are added up as "Other".
const foldSmallSlices = (rows) => {
  const sorted = [...rows].filter((row) => row.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= MAX_SLICES) return sorted;
  const kept = sorted.slice(0, MAX_SLICES - 1);
  const other = sorted.slice(MAX_SLICES - 1).reduce((sum, row) => sum + row.value, 0);
  return [...kept, { label: "Other", value: other, isOther: true }];
};

// Shows how a whole is split, for example tickets by language. rows: [{ label, value }]
// formatValue writes the number in the middle, which only has room for a short one ("Rs. 8.7L").
const DonutChart = ({ rows, formatValue = String, totalLabel = "Total" }) => {
  const [active, setActive] = useState(null);
  const slices = foldSmallSlices(rows);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return <p className="muted">No data for these dates.</p>;
  }

  // A slice keeps the same colour whatever its size, by giving colours in name order.
  const colourOrder = slices
    .filter((slice) => !slice.isOther)
    .map((slice) => slice.label)
    .sort((a, b) => a.localeCompare(b));
  const colourOf = (slice) =>
    slice.isOther ? "var(--series-other)" : `var(--series-${colourOrder.indexOf(slice.label) + 1})`;
  const shown = active === null ? null : slices[active];

  return (
    <div className="donut-chart">
      <div className="donut">
        <PieChart width={SIZE} height={SIZE}>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={1}
            stroke="none"
            onMouseEnter={(_, index) => setActive(index)}
            onMouseLeave={() => setActive(null)}
          >
            {slices.map((slice, index) => (
              <Cell
                key={slice.label}
                fill={colourOf(slice)}
                opacity={active === null || active === index ? 1 : 0.4}
              />
            ))}
          </Pie>
        </PieChart>
        <div className="donut-centre">
          <span className="donut-caption">{shown ? shown.label : totalLabel}</span>
          <strong className="donut-value">{formatValue(shown ? shown.value : total)}</strong>
        </div>
      </div>

      <ul className="chart-legend">
        {slices.map((slice, index) => (
          <li
            key={slice.label}
            className={active === index ? "active" : ""}
            onPointerEnter={() => setActive(index)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="legend-swatch" style={{ background: colourOf(slice) }} />
            <span className="legend-label">{slice.label}</span>
            <span className="legend-value">{Math.round((slice.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutChart;
