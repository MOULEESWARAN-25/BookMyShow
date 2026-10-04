// groupBy([{ city: "Chennai" }, { city: "Madurai" }], (item) => item.city)
// => [["Chennai", [...]], ["Madurai", [...]]], keeping the original order.
const groupBy = (items, getKey) => {
  const groups = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  return [...groups.entries()];
};

// ["Tamil", "Hindi", "Tamil"] => [{ value: "Hindi", label: "Hindi" }, { value: "Tamil", label: "Tamil" }]
const toOptions = (values) =>
  [...new Set(values)].sort().map((value) => ({ value, label: value }));

export { groupBy, toOptions };
