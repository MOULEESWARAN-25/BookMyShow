// A dropdown filter with an icon. An empty value means "no filter", shown as allLabel.
// options: [{ value: "Chennai", label: "Chennai" }, ...]
const FilterSelect = ({ icon: Icon, label, allLabel, value, options, onChange }) => (
  <label className={value ? "filter-select active" : "filter-select"}>
    <Icon />
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default FilterSelect;
