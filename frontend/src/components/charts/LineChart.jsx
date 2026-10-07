import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TOOLTIP_STYLE, TICK_STYLE } from "./chartStyles";

// Rounds the top of the axis up to a clean number: 38,000 => 40,000.
const niceMax = (value) => {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((multiple) => multiple * power >= value);
  return step * power;
};

// A trend over time, for example revenue per day.
// points: [{ label: "5 Oct", value: 24500 }] in time order.
const LineChart = ({ points, formatValue = String, formatAxis = String }) => {
  if (points.length === 0) {
    return <p className="muted">No data for these dates.</p>;
  }

  const top = niceMax(Math.max(...points.map((point) => point.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => share * top);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={TICK_STYLE} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis
          domain={[0, top]}
          ticks={ticks}
          tick={TICK_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatAxis}
          width={48}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatValue(value)]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="var(--primary)"
          fillOpacity={0.12}
          activeDot={{ r: 5 }}
          // A single day has no line to draw, so its point is shown as a dot.
          dot={points.length === 1 ? { r: 4, fill: "var(--primary)" } : false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
