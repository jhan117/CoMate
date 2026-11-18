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
  const [error, setError] = useState("");

  const syncSessionUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      const nextUser = data?.user || null;
      setInternalUser((prev) => {
        if (prev?.id === nextUser?.id) return prev;
        return nextUser;
      });
      return nextUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleUserChanged = (e) => {
      setInternalUser(e.detail || null);
      setError("");
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    );

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const nextUser = data?.user || null;
        setInternalUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
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

  const fetchNotificationsForUser = useCallback(async (targetUserId) => {
    try {
      await Promise.resolve();
      if (!targetUserId) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      if (err.status === 401) {
        setInternalUser(null);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setError(err.message || "알림 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setError("");
    const currentSessionUser =
      externalUser !== null ? externalUser : await syncSessionUser();
    const targetUserId = currentSessionUser?.id || userId;
    await fetchNotificationsForUser(targetUserId);
  }, [externalUser, fetchNotificationsForUser, syncSessionUser, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications()
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {});
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
    setError("");
    try {
      const data = await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? data.notification : n))
      );
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message || "알림 읽음 처리에 실패했습니다.");
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    setError("");
    try {
      const data = await markAllNotificationsAsRead();
      setNotifications(data.notifications || []);
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || "전체 읽음 처리에 실패했습니다.");
    }
  };

  const removeNotification = async (notificationId) => {
    setError("");
    try {
      const data = await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message || "알림 삭제에 실패했습니다.");
    }
  };

  return {
    activeUser,
    notifications: userId ? notifications : [],
    unreadCount: userId ? unreadCount : 0,
    loading: userId ? loading : false,
    error,
    actions: {
      refresh: loadNotifications,
      markAsRead,
      markAllAsRead,
      remove: removeNotification,
    },
  };
}
