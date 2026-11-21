import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import DashboardIcon from '../../components/ui/DashboardIcon';
import NotificationFeed from './NotificationFeed';
import { createPortal } from 'react-dom';

export default function NotificationBell({ basePath }) {
  const { notifications, unreadNotifications, notificationsLoading, notificationsError, refreshNotifications, markAllNotificationsRead, notify } = useApp();
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const shell = root.current?.closest('.member-shell, .dashboard-shell');
    const previousInert = shell?.inert;
    const previousOverflow = document.body.style.overflow;
    if (shell) shell.inert = true;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    const escape = event => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const items = [...panel.current.querySelectorAll('a,button')].filter(item => !item.disabled);
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', escape);
    return () => { if (shell) shell.inert = previousInert; document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', escape); window.requestAnimationFrame(() => trigger.current?.focus()); };
  }, [open]);
  async function markRead() {
    setMarking(true);
    try { const result = await markAllNotificationsRead(); if (!result.success) notify(result.error || 'Could not update notifications.', 'error'); }
    finally { setMarking(false); }
  }
  return <><span className="theme-slot" data-theme-slot /><div className="member-bell" ref={root}>
    <button ref={trigger} className="member-icon-button member-bell__trigger" type="button" aria-label={`Notifications, ${unreadNotifications} unread`} aria-expanded={open} aria-controls="member-notification-popover" onClick={() => { if (!open) void refreshNotifications({ silent: true }); setOpen(value => !value); }}>
      <DashboardIcon name="bell" size={22} />
      {unreadNotifications > 0 && <span className="member-bell__badge" aria-hidden="true">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
    </button>
    {open && createPortal(<div className="notification-drawer-layer"><button className="notification-drawer-backdrop" tabIndex={-1} aria-label="Close notifications" onClick={() => setOpen(false)} /><section ref={panel} id="member-notification-popover" className="member-notification-popover notification-drawer" role="dialog" aria-modal="true" aria-label="Notifications">
      <header><div><h2>Notifications</h2><p>{unreadNotifications} unread · Your latest activity</p></div><button type="button" className="member-icon-button" aria-label="Close notifications" onClick={() => { setOpen(false); trigger.current?.focus(); }}><DashboardIcon name="close" size={18} /></button></header>
      <div className="member-notification-popover__tools"><button type="button" onClick={() => void refreshNotifications()} disabled={notificationsLoading}>Refresh</button><button type="button" onClick={markRead} disabled={marking || unreadNotifications === 0}>{marking ? 'Updating…' : 'Mark all as read'}</button></div>
      <div className="member-notification-popover__body">
        {notificationsLoading && notifications.length === 0 && <p className="member-feedback" role="status">Loading notifications…</p>}
        {notificationsError && <p className="member-feedback" role="alert">{notificationsError}</p>}
        {!notificationsLoading && !notificationsError && notifications.length === 0 && <p className="member-feedback">You’re all caught up. New activity will appear here.</p>}
        <NotificationFeed notifications={notifications.slice(0, 8)} compact />
      </div>
      <Link className="member-notification-popover__all" to={`${basePath}/notifications`}>View all notifications <DashboardIcon name="arrowRight" size={16} /></Link>
    </section></div>, document.body)}
  </div></>;
}
