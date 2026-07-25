import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('otp_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'init-1',
        title: 'System Initialized',
        message: 'OTP Manager central 2FA service active.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'info',
      },
      {
        id: 'init-2',
        title: 'Test App Ready',
        message: 'Sample application ready for 2FA testing.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'success',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('otp_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const addNotification = useCallback((title, message, type = 'info') => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    
    // Toast da göster
    if (type === 'success') toast.success(`${title}: ${message}`);
    else if (type === 'error') toast.error(`${title}: ${message}`);
    else toast(`${title}: ${message}`, { icon: '🔔' });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAllAsRead, clearNotifications, unreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;
