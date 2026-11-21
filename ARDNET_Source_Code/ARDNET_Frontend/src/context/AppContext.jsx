import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { alertsService, notificationsService } from '../api';
import { getStorage, setStorage } from '../utils/storage';

const AppContext = createContext(null);
const NOTIFICATION_REFRESH_MS = 30000; // Keep it simple: no websockets needed yet.

export function AppProvider({ children }) {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  // Include the account identity so switching users clears previously loaded data.
  const accountId = user?.id ?? user?.user_id ?? user?.email ?? null;
  const sessionKey = accountId && token ? `${accountId}:${token}` : null;
  const isSignedIn = Boolean(sessionKey);
  const activeSession = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  // Only non-alert demo support requests continue to use localStorage.
  const [supportRequests, setSupportRequests] = useState(() => getStorage('ardnet.supportRequests', []));
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // Prevent one account's data from flashing when another account signs in.
  const [alertsOwner, setAlertsOwner] = useState(null);
  const [notificationsOwner, setNotificationsOwner] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState('');
  const [notificationsError, setNotificationsError] = useState('');
  const [suspendedSession, setSuspendedSession] = useState(null);
  const accountSuspended = Boolean(sessionKey && suspendedSession === sessionKey);

  useEffect(() => {
    const suspended = () => { if (sessionKey) setSuspendedSession(sessionKey); };
    window.addEventListener('auth:suspended', suspended);
    return () => window.removeEventListener('auth:suspended', suspended);
  }, [sessionKey]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const submitSupportRequest = useCallback((request) => {
    setSupportRequests((previous) => {
      const next = [{ id: Date.now(), createdAt: new Date().toISOString(), status: 'New', ...request }, ...previous];
      setStorage('ardnet.supportRequests', next);
      return next;
    });
  }, []);

  const updateSupportRequest = useCallback((id, status) => {
    setSupportRequests((previous) => {
      const next = previous.map((request) => request.id === id ? { ...request, status } : request);
      setStorage('ardnet.supportRequests', next);
      return next;
    });
  }, []);

  const replyToSupportRequest = useCallback((id, reply) => {
    setSupportRequests((previous) => {
      const next = previous.map((request) => request.id === id
        ? { ...request, status: 'Replied', replies: [...(request.replies || []), {
          message: reply, sender: 'ArdNet Administrator', createdAt: new Date().toISOString(),
        }] }
        : request);
      setStorage('ardnet.supportRequests', next);
      return next;
    });
  }, []);

  const refreshAlerts = useCallback(async ({ silent = false } = {}) => {
    if (!sessionKey) return { success: false, error: 'Sign in to view alerts.' };
    if (!silent) setAlertsLoading(true);
    try {
      const response = await alertsService.getAlerts();
      if (activeSession.current !== sessionKey) return response; // Old user / logged out.
      if (response.success && Array.isArray(response.data)) {
        setAlerts(response.data);
        setAlertsOwner(sessionKey);
        setAlertsError('');
      } else {
        setAlertsError(response.error || 'Unable to load price alerts.');
      }
      return response;
    } finally {
      if (!silent && activeSession.current === sessionKey) setAlertsLoading(false);
    }
  }, [sessionKey]);

  const refreshNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!sessionKey) return { success: false, error: 'Sign in to view notifications.' };
    if (!silent) setNotificationsLoading(true);
    try {
      const response = await notificationsService.getNotifications();
      if (activeSession.current !== sessionKey) return response;
      const rows = Array.isArray(response.data) ? response.data : response.data?.notifications;
      if (response.success && Array.isArray(rows)) {
        setNotifications(rows);
        if (response.data?.accountStatus) setSuspendedSession(response.data.accountStatus === 'suspended' ? sessionKey : null);
        setNotificationsOwner(sessionKey);
        setNotificationsError('');
      } else {
        setNotificationsError(response.error || 'Unable to load notifications.');
      }
      return response;
    } finally {
      if (!silent && activeSession.current === sessionKey) setNotificationsLoading(false);
    }
  }, [sessionKey]);

  useEffect(() => {
    activeSession.current = sessionKey;
    setAlerts([]);
    setNotifications([]);
    setAlertsOwner(null);
    setNotificationsOwner(null);
    setSuspendedSession(null);
    setAlertsError('');
    setNotificationsError('');
    setAlertsLoading(Boolean(sessionKey));
    setNotificationsLoading(Boolean(sessionKey));
    if (!sessionKey) return undefined;

    void refreshAlerts();
    void refreshNotifications();
    const timer = window.setInterval(() => {
      void refreshNotifications({ silent: true });
    }, NOTIFICATION_REFRESH_MS);
    const onFocus = () => { void refreshNotifications({ silent: true }); };
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      if (activeSession.current === sessionKey) activeSession.current = null;
    };
  }, [sessionKey, refreshAlerts, refreshNotifications]);

  const createPriceAlert = useCallback(async (payload) => {
    if (!sessionKey) return { success: false, error: 'Please sign in first.' };
    const response = await alertsService.createAlert(payload);
    if (response.success && activeSession.current === sessionKey) {
      if (response.data?.alert_id != null) {
        setAlerts((existing) => [response.data, ...existing.filter((row) => row.alert_id !== response.data.alert_id)]);
        setAlertsOwner(sessionKey);
      }
      void refreshAlerts({ silent: true });
    }
    return response;
  }, [sessionKey, refreshAlerts]);

  const updatePriceAlert = useCallback(async (id, payload) => {
    if (!sessionKey) return { success: false, error: 'Please sign in first.' };
    const response = await alertsService.updateAlert(id, payload);
    if (response.success && activeSession.current === sessionKey) {
      if (response.data?.alert_id != null) {
        setAlerts((existing) => existing.map((row) => row.alert_id === response.data.alert_id ? response.data : row));
        setAlertsOwner(sessionKey);
      }
      void refreshAlerts({ silent: true });
    }
    return response;
  }, [sessionKey, refreshAlerts]);

  const deletePriceAlert = useCallback(async (id) => {
    if (!sessionKey) return { success: false, error: 'Please sign in first.' };
    const response = await alertsService.deleteAlert(id);
    if (response.success && activeSession.current === sessionKey) {
      setAlerts((existing) => existing.filter((row) => row.alert_id !== id));
      setAlertsOwner(sessionKey);
      void refreshAlerts({ silent: true });
    }
    return response;
  }, [sessionKey, refreshAlerts]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!sessionKey) return { success: false, error: 'Please sign in first.' };
    const response = await notificationsService.markAllRead();
    if (response.success && activeSession.current === sessionKey) {
      setNotificationsOwner(sessionKey);
      setNotifications((existing) => existing.map((row) => row.status === 'Unread'
        ? { ...row, status: 'Read', read_at: new Date().toISOString() }
        : row));
      void refreshNotifications({ silent: true });
    }
    return response;
  }, [sessionKey, refreshNotifications]);

  const visibleAlerts = alertsOwner === sessionKey ? alerts : [];
  const visibleNotifications = notificationsOwner === sessionKey ? notifications : [];
  const unreadNotifications = visibleNotifications.filter((row) => row.status === 'Unread').length;
  const value = useMemo(() => ({
    toast, notify,
    supportRequests, submitSupportRequest, updateSupportRequest, replyToSupportRequest,
    isSignedIn, accountSuspended, alerts: visibleAlerts, alertsLoading, alertsError, refreshAlerts,
    createPriceAlert, updatePriceAlert, deletePriceAlert,
    notifications: visibleNotifications, notificationsLoading, notificationsError, refreshNotifications,
    unreadNotifications, markAllNotificationsRead,
  }), [
    toast, notify, supportRequests, submitSupportRequest, updateSupportRequest, replyToSupportRequest,
    isSignedIn, accountSuspended, visibleAlerts, alertsLoading, alertsError, refreshAlerts,
    createPriceAlert, updatePriceAlert, deletePriceAlert,
    visibleNotifications, notificationsLoading, notificationsError, refreshNotifications,
    unreadNotifications, markAllNotificationsRead,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
