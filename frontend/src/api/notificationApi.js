export async function fetchNotifications(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`/api/notifications${query}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "알림 목록을 불러오지 못했습니다.");
  }
  return data;
}

export async function markNotificationAsRead(notificationId) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "알림 읽음 처리에 실패했습니다.");
  }
  return data;
}

export async function markAllNotificationsAsRead(userId) {
  const res = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "전체 읽음 처리에 실패했습니다.");
  }
  return data;
}

export async function deleteNotification(notificationId) {
  const res = await fetch(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "알림 삭제에 실패했습니다.");
  }
  return data;
}
