import ListingIcon from './ListingIcon';

export default function ListingFilters({
  query, setQuery, category, setCategory, location, setLocation,
  sort, setSort, categories = [], locations = [], onClear,
}) {
  return (
    <div className="produce-filters" aria-label="Filter produce listings">
      <label className="produce-filters__search">
        <ListingIcon name="search" size={19}/>
        <span className="sr-only">Search produce, farmers, or locations</span>
        <input type="search" placeholder="Search produce, farmer, or location..."
          value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label className="produce-filters__select">
        <span className="sr-only">Filter by category</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="produce-filters__select">
        <span className="sr-only">Filter by location</span>
        <select value={location} onChange={(event) => setLocation(event.target.value)}>
          <option value="all">All locations</option>
          {locations.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="produce-filters__select produce-filters__sort">
        <span className="sr-only">Sort listings</span>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="latest">Newest first</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </label>
      {(query || category !== 'all' || location !== 'all' || sort !== 'latest') && (
        <button type="button" className="produce-filters__reset" onClick={onClear}>Clear filters</button>
      )}
    </div>
  );
}
