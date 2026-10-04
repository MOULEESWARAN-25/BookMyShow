// "a, b ,C" => ["A", "B", "C"]. The backend checks that each row is letters only.
const parseSeatRows = (text) =>
  text
    .split(",")
    .map((row) => row.trim().toUpperCase())
    .filter(Boolean);

export { parseSeatRows };
