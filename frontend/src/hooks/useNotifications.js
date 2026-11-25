import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchCurrentUser } from "../api/authApi";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../api/notificationApi";
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_TYPES,
} from "../constants/notificationConstants";

export function useNotifications(externalUser) {
  const isControlled = externalUser !== undefined;
  const [internalUser, setInternalUser] = useState(null);
  const activeUser = isControlled ? externalUser : internalUser;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const syncSessionUser = useCallback(async () => {
    try {
      const nextUser = await fetchCurrentUser();
      if (!isControlled) {
        setInternalUser((prev) =>
          prev?.id === nextUser?.id ? prev : nextUser
        );
      }
      return nextUser;
    } catch {
      return null;
    }
  }, [isControlled]);

  useEffect(() => {
    if (isControlled) return undefined;

    let active = true;
    const handleUserChanged = (e) => {
      setInternalUser(e.detail || null);
      setError("");
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    );

    fetchCurrentUser()
      .then((nextUser) => {
        if (!active) return;
        setInternalUser((prev) =>
          prev?.id === nextUser?.id ? prev : nextUser
        );
      })
      .catch(() => {});

    return () => {
      active = false;
      window.removeEventListener(
        NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
        handleUserChanged
      );
    };
  }, [isControlled]);

  const userId = activeUser?.id;

  const fetchNotificationsForUser = useCallback(
    async (targetUserId) => {
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
          if (!isControlled) setInternalUser(null);
          setNotifications([]);
          setUnreadCount(0);
        } else {
          setError(err.message || "알림 목록을 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [isControlled]
  );

  const loadNotifications = useCallback(async () => {
    setError("");
    const currentSessionUser = isControlled
      ? externalUser
      : await syncSessionUser();
    const targetUserId = currentSessionUser?.id || userId;
    await fetchNotificationsForUser(targetUserId);
  }, [
    externalUser,
    fetchNotificationsForUser,
    isControlled,
    syncSessionUser,
    userId,
  ]);

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
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("notification:updated", () => {
      loadNotifications();
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, loadNotifications]);

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

  const markAllAsRead = async (filter = "all") => {
    if (!userId) return;
    setError("");
    try {
      const data = await markAllNotificationsAsRead(filter);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(err.message || "전체 읽음 처리에 실패했습니다.");
    }
  };

  const removeAllNotifications = async (filter = "all") => {
    if (!userId) return false;
    setError("");
    try {
      const data = await deleteAllNotifications(filter);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
      return true;
    } catch (err) {
      setError(err.message || "알림 일괄 삭제에 실패했습니다.");
      return false;
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

  const visibleNotifications = userId ? notifications : [];
  const recruitmentNotifications = visibleNotifications.filter(
    (n) => n.type !== NOTIFICATION_TYPES.MESSAGE_NEW
  );
  const recruitmentUnreadCount = recruitmentNotifications.filter(
    (n) => !n.isRead
  ).length;
  const unreadMessageCount = visibleNotifications.filter(
    (n) => n.type === NOTIFICATION_TYPES.MESSAGE_NEW && !n.isRead
  ).length;

  return {
    activeUser,
    notifications: visibleNotifications,
    unreadCount: userId ? unreadCount : 0,
    recruitmentNotifications,
    recruitmentUnreadCount,
    unreadMessageCount,
    loading: userId ? loading : false,
    error,
    actions: {
      refresh: loadNotifications,
      markAsRead,
      markAllAsRead,
      removeAll: removeAllNotifications,
      remove: removeNotification,
      clearError: () => setError(""),
    },
  };
}
