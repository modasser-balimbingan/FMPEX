import ListingIcon from '../../features/listings/ListingIcon';

export default function DashboardIcon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chart: <><path d="M4 3v18h17M8 15l4-5 4 2 5-7" /></>,
    weather: <><circle cx="8" cy="8" r="4" /><path d="M8 1V0M1 8H0m3-5L2 2m11 1 1-1m-2 18H7a4 4 0 1 1 1-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 0 9Z" /></>,
    settings: <><circle cx="12" cy="12" r="4" /><path d="m9 3 1-2h4l1 2 3 2 2 1 2 4-2 2v3l-1 3-3 1-2 3h-4l-2-3-3-1-2-3v-3L1 10l2-4 3-1Z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    panel: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 3v18m7-13-3 4 3 4" /></>,
    logout: <><path d="M9 4H3v16h6m5-12 4 4-4 4m-5-4h12" /></>,
    shield: <><path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z" /><path d="M12 8v5m0 3v1" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M16 4a4 4 0 0 1 0 8m3 3a6 6 0 0 1 3 6" /></>,
    categories: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    history: <><path d="M3 10a9 9 0 1 1 1 8M3 4v6h6M12 7v5l3 2" /></>,
    connections: <><rect x="8" y="8" width="8" height="8" rx="2" /><path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3" /></>,
    plus: <path d="M12 4v16M4 12h16" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  };
  return paths[name] ? <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> : <ListingIcon name={name} size={size} />;
}
