import { useState } from 'react';
import { useApp } from '../context/AppContext';
import NotificationFeed from '../features/notifications/NotificationFeed';

export default function NotificationsPage() {
  const { notifications, notificationsLoading, notificationsError, unreadNotifications, refreshNotifications, markAllNotificationsRead, notify } = useApp();
  const [filter, setFilter] = useState('all');
  const [visible, setVisible] = useState(20);
  const [marking, setMarking] = useState(false);
  const rows = filter === 'unread' ? notifications.filter(row => row.status === 'Unread') : notifications;
  async function markRead() {
    setMarking(true);
    try { const result = await markAllNotificationsRead(); if (!result.success) notify(result.error || 'Could not update notifications.', 'error'); }
    finally { setMarking(false); }
  }
  return <div className="page member-notifications-page">
    <div className="page-heading"><div><p className="member-kicker">YOUR ACTIVITY, IN ONE PLACE</p><h1>Notifications</h1><p className="muted">Price alerts, welcome messages, listing discussions, and account updates. {unreadNotifications} unread.</p></div><div className="member-notifications-page__actions"><button className="member-button member-button--outline" type="button" disabled={notificationsLoading} onClick={() => void refreshNotifications()}>Refresh</button><button className="member-button" type="button" disabled={marking || unreadNotifications === 0} onClick={markRead}>{marking ? 'Updating…' : 'Mark all as read'}</button></div></div>
    <div className="member-notification-filters"><button type="button" aria-pressed={filter === 'all'} onClick={() => { setFilter('all'); setVisible(20); }}>All activity ({notifications.length})</button><button type="button" aria-pressed={filter === 'unread'} onClick={() => { setFilter('unread'); setVisible(20); }}>Unread ({unreadNotifications})</button></div>
    <section className="member-notifications-page__list" aria-label="Notification history">
      {notificationsError && <p role="alert" className="member-feedback">{notificationsError}</p>}
      {notificationsLoading && notifications.length === 0 && <p role="status" className="member-feedback">Loading notifications…</p>}
      {!notificationsLoading && !notificationsError && rows.length === 0 && <p className="member-feedback">{filter === 'unread' ? 'You’re all caught up. No unread notifications.' : 'No activity yet. Your notifications will appear here.'}</p>}
      <NotificationFeed notifications={rows.slice(0, visible)} />
      {rows.length > visible && <button className="member-button member-button--outline member-load-more" type="button" onClick={() => setVisible(value => value + 20)}>Show more notifications</button>}
    </section>
  </div>;
}
