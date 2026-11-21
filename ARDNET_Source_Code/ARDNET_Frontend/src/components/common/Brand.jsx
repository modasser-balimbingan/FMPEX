import { Link } from 'react-router-dom';
import ardnetLogo from '../../../assets/ARDNET_LOGO.svg';

export default function Brand({ compact = false, to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="ArdNet home">
      <img className="brand-mark" src={ardnetLogo} width="44" height="44" alt="" aria-hidden="true" />
      <span className="brand-copy">
        <strong>ArdNet</strong>
        {!compact && <small>Farm-to-Market Price Exchange</small>}
      </span>
    </Link>
  );
}
