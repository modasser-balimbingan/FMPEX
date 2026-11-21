import DashboardIcon from '../../components/ui/DashboardIcon';

function notificationIcon(title) {
  if (/suspend|reactivat|account/i.test(title)) return 'shield';
  if (/comment|reply/i.test(title)) return 'message';
  if (/welcome/i.test(title)) return 'leaf';
  return 'bell';
}

export default function NotificationFeed({ notifications, compact = false }) {
  return <div className={`member-notification-feed${compact ? ' is-compact' : ''}`}>
    {notifications.map(row => <article className={`member-notification${row.status === 'Unread' ? ' is-unread' : ''}`} key={row.notification_id}>
      <span className="member-notification__icon"><DashboardIcon name={notificationIcon(row.title)} size={18} /></span>
      <div><h3>{row.title}</h3><p>{row.message}</p><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
      {row.status === 'Unread' && <span className="member-notification__fresh" aria-label="Unread" />}
    </article>)}
  </div>;
}
