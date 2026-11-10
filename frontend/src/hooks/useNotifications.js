import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notificationApi";
import { NOTIFICATION_EVENTS } from "../constants/notificationConstants";

export function useNotifications(externalUser = null) {
  const [internalUser, setInternalUser] = useState(null);
  const activeUser = externalUser !== null ? externalUser : internalUser;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUserChanged = (e) => {
      setInternalUser(e.detail || null);
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    );

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setInternalUser((prev) => prev || data.user);
        }
      })
      .catch(() => { });

    return () => {
      window.removeEventListener(
        NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
        handleUserChanged
      );
    };
  }, []);

  const userId = activeUser?.id;

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchNotifications(userId);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error("알림 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;

    if (!userId) {
      return;
    }

    setLoading(true);
    fetchNotifications(userId)
      .then((data) => {
        if (active) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch((err) => {
        if (active) console.error("알림 조회 실패:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    const handleUpdated = () => {
      loadNotifications();
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.NOTIFICATIONS_UPDATED,
      handleUpdated
    );
    return () => {
      window.removeEventListener(
        NOTIFICATION_EVENTS.NOTIFICATIONS_UPDATED,
        handleUpdated
      );
    };
  }, [loadNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const data = await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? data.notification : n))
      );
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("알림 읽음 처리 오류:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const data = await markAllNotificationsAsRead(userId);
      setNotifications(data.notifications || []);
      setUnreadCount(0);
    } catch (err) {
      console.error("전체 읽음 처리 오류:", err);
    }
  };

  const removeNotification = async (notificationId) => {
    try {
      const data = await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("알림 삭제 오류:", err);
    }
  };

  return {
    activeUser,
    notifications: userId ? notifications : [],
    unreadCount: userId ? unreadCount : 0,
    loading: userId ? loading : false,
    actions: {
      refresh: loadNotifications,
      markAsRead,
      markAllAsRead,
      remove: removeNotification,
    },
  };
}
