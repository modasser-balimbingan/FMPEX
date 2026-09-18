import Card from '../components/common/Card';
import { useApp } from '../context/AppContext';

export default function NotificationsPage() {
  const { notifications, markAllNotificationsRead } = useApp();
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">NOTIFICATIONS</p>
          <h1>Notifications</h1>
          <p className="muted">Price alerts, system messages, and other activity.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={markAllNotificationsRead}>Mark all as read</button>
      </div>

      <Card style={{ padding: 0 }}>
        <div className="notification-list">
          {notifications.length === 0 ? <p className="muted" style={{ padding: 22 }}>No notifications yet.</p> : notifications.map((notification) => (
            <div className="notification-row" key={notification.id}>
              <div className="notification-icon">!</div>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.text}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
              </div>
              <span className="status active">{notification.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
