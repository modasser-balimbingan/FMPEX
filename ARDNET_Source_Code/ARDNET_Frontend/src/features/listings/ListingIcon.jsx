// Small inline icons; no new frontend package is required.
export default function ListingIcon({ name, size = 18, className = '', filled = false }) {
  const paths = {
    message: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 10.5 10.5 0 0 1-4-.8L3 21l1.8-5.5a8.5 8.5 0 1 1 16.2-4Z"/>,
    reply: <path d="m9 10-5 4 5 4v-3h5a6 6 0 0 0 6-6V7c0 3.4-2.4 5-6 5H9v-2Z"/>,
    send: <><path d="m22 2-7.5 20-3.4-9.1L2 9.5 22 2Z"/><path d="M11.1 12.9 22 2"/></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    package: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></>,
    leaf: <><path d="M21 3c-9 0-16 3-16 11a7 7 0 0 0 7 7c8 0 9-9 9-18Z"/><path d="M5 21c3-6 6-9 12-12"/></>,
    arrowRight: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    left: <path d="m15 18-6-6 6-6"/>,
    right: <path d="m9 18 6-6-6-6"/>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="3"/></>,
    expand: <><path d="M8 3H3v5m18 8v5h-5M3 3l7 7m11 11-7-7"/></>,
    edit: <><path d="m15 5 4 4M4 20l5-.8L20 8a3 3 0 0 0-4-4L5 15 4 20Z"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7M10 11v6m4-6v6"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></>,
  };
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill={name === 'heart' && filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {paths[name] || paths.leaf}
    </svg>
  );
}
