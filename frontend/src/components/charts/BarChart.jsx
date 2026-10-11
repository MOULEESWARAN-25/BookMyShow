import {
  Bar,
  BarChart as RechartsBarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TOOLTIP_STYLE, TICK_STYLE } from "./chartStyles";

const ROW_HEIGHT = 36;
// Roughly how wide one letter of a 12px label is, to fit the label column to the longest label.
const LETTER_WIDTH = 8;

// Horizontal bars for comparing values, for example occupancy per movie.
// rows: [{ label: "Neon Coast", value: 43.2 }]
// max fixes the end of the scale, such as 100 for percentages.
const BarChart = ({ rows, formatValue = String, max }) => {
  if (rows.length === 0) {
    return <p className="muted">No data for these dates.</p>;
  }

  const labelWidth = Math.min(Math.max(...rows.map((row) => String(row.label).length)) * LETTER_WIDTH + 16, 170);

  return (
    <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT + 8}>
      <RechartsBarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }}>
        <XAxis type="number" hide domain={[0, max ?? "auto"]} />
        <YAxis type="category" dataKey="label" width={labelWidth} tick={TICK_STYLE} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatValue(value)]}
        />
        <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={18}>
          <LabelList dataKey="value" position="right" formatter={formatValue} style={TICK_STYLE} />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
