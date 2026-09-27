import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { DEMO_PRICES } from '../utils/constants';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [supportRequests, setSupportRequests] = useState(() => getStorage('ardnet.supportRequests', []));
  const [alerts, setAlerts] = useState(() => getStorage('ardnet.alerts', []));
  const [notifications, setNotifications] = useState(() => getStorage('ardnet.notifications', []));
  const toastTimer = useRef(null);

  // React hook pattern: cleanup a timer when the provider unmounts.
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const submitSupportRequest = useCallback((request) => {
    const next = [{
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'New',
      ...request,
    }, ...supportRequests];
    setSupportRequests(next);
    setStorage('ardnet.supportRequests', next);
  }, [supportRequests]);

  const updateSupportRequest = useCallback((id, status) => {
    const next = supportRequests.map((request) => request.id === id ? { ...request, status } : request);
    setSupportRequests(next);
    setStorage('ardnet.supportRequests', next);
  }, [supportRequests]);

  const replyToSupportRequest = useCallback((id, reply) => {
    const next = supportRequests.map((request) => request.id === id
      ? {
        ...request,
        status: 'Replied',
        replies: [...(request.replies || []), {
          message: reply,
          sender: 'ArdNet Administrator',
          createdAt: new Date().toISOString(),
        }],
      }
      : request);
    setSupportRequests(next);
    setStorage('ardnet.supportRequests', next);
  }, [supportRequests]);

  const createPriceAlert = useCallback((alert) => {
    const currentPrice = DEMO_PRICES.find((price) => price.produce === alert.produce && price.location === alert.location);
    const triggered = currentPrice && alert.condition === 'at-or-above' && currentPrice.price >= Number(alert.target);
    const nextAlert = { id: Date.now(), ...alert, status: triggered ? 'Triggered' : 'Active', createdAt: new Date().toISOString() };
    const nextAlerts = [nextAlert, ...alerts];
    const notification = {
      id: Date.now() + 1,
      title: triggered ? `${alert.produce} price alert triggered` : `${alert.produce} price alert created`,
      text: triggered ? `Reference price reached ₱${currentPrice.price}/${currentPrice.unit}.` : 'We will notify you when the target condition is met.',
      status: 'Unread',
      createdAt: new Date().toISOString(),
    };
    setAlerts(nextAlerts);
    setNotifications([notification, ...notifications]);
    setStorage('ardnet.alerts', nextAlerts);
    setStorage('ardnet.notifications', [notification, ...notifications]);
  }, [alerts, notifications]);

  const markAllNotificationsRead = useCallback(() => {
    const nextNotifications = notifications.map((notification) => (
      notification.status === 'Read' ? notification : { ...notification, status: 'Read' }
    ));
    setNotifications(nextNotifications);
    setStorage('ardnet.notifications', nextNotifications);
  }, [notifications]);

  const value = useMemo(() => ({
    toast,
    notify,
    supportRequests,
    submitSupportRequest,
    updateSupportRequest,
    replyToSupportRequest,
    alerts,
    notifications,
    createPriceAlert,
    markAllNotificationsRead,
  }), [
    toast,
    notify,
    supportRequests,
    submitSupportRequest,
    updateSupportRequest,
    replyToSupportRequest,
    alerts,
    notifications,
    createPriceAlert,
    markAllNotificationsRead,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
