import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationService } from '../api/dataService';

const NotificationContext = createContext();

const POLL_INTERVAL = 30_000;

function normaliseNotif(n) {
  return {
    id: n.id,
    title: n.title || n.message || 'Notification',
    message: n.message || n.body || '',
    description: n.body || n.message || '',
    time: n.created_at ? new Date(n.created_at).toLocaleString('en-AU') : 'Just now',
    unread: n.is_read === false || n.read_at === null || n.read_at === undefined,
    type: n.type || n.notification_type || 'info',
    entity_id: n.entity_id || null,
  };
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const deletedIds = React.useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.items) ? res.data.items
          : null;
        if (list) setNotifications(list.map(normaliseNotif).filter(n => !deletedIds.current.has(n.id)));
      }
    } catch { /* stay silent on network error */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [
      { id: Date.now(), unread: true, time: 'Just now', ...notification },
      ...prev,
    ]);
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    try { await notificationService.markAsRead(id); } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    try { await notificationService.markAllAsRead(); } catch { /* ignore */ }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    deletedIds.current.add(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await notificationService.deleteNotification(id); } catch { /* ignore */ }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    setNotifications(prev => { prev.forEach(n => deletedIds.current.add(n.id)); return []; });
    try { await notificationService.deleteAllNotifications(); } catch { /* ignore */ }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllRead,
      deleteNotification,
      deleteAllNotifications,
      refetch: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
