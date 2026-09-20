import { PRODUCE_CATEGORY_GROUPS, ZAMBOANGA_DEL_SUR_LOCATIONS, categorySlug } from '../../utils/constants';

export default function ListingFilters({
  query,
  setQuery,
  category,
  setCategory,
  location,
  setLocation,
}) {
  return (
    <div className="browser-tools">
      <input
        className="input"
        placeholder="Search produce..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search produce"
      />
      <select
        className="select"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Filter by category"
      >
        <option value="all">All categories</option>
        {PRODUCE_CATEGORY_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.items.map((item) => <option key={item} value={categorySlug(item)}>{item}</option>)}
          </optgroup>
        ))}
      </select>
      <select
        className="select"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        aria-label="Filter by location"
      >
        <option value="all">All locations</option>
        {ZAMBOANGA_DEL_SUR_LOCATIONS.map((item) => <option key={item}>{item}</option>)}
      </select>
    </div>
  );
}
