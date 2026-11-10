import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notificationApi";
import { NOTIFICATION_EVENTS } from "../constants/notificationConstants";

export function useNotifications(externalUser = null) {
  const [activeUser, setActiveUser] = useState(externalUser);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalUser !== null) {
      setActiveUser(externalUser);
    }
  }, [externalUser]);

  useEffect(() => {
    const handleUserChanged = (e) => {
      setActiveUser(e.detail || null);
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    );

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setActiveUser((prev) => prev || data.user);
        }
      })
      .catch(() => {});

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
    loadNotifications();
  }, [loadNotifications]);

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
    notifications,
    unreadCount,
    loading,
    actions: {
      refresh: loadNotifications,
      markAsRead,
      markAllAsRead,
      remove: removeNotification,
    },
  };
}
