import { Link } from 'react-router-dom';

export default function Brand({ compact = false, to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="ArdNet home">
      <span className="brand-mark">A</span>
      <span className="brand-copy">
        <strong>ArdNet</strong>
        {!compact && <small>Farm-to-Market Price Exchange</small>}
      </span>
    </Link>
  );
}
