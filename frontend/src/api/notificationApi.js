async function requestJson(url, options = {}, defaultErrorMessage) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || defaultErrorMessage);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function fetchNotifications() {
  return requestJson(
    "/api/notifications",
    { method: "GET" },
    "알림 목록을 불러오지 못했습니다."
  );
}

export async function markNotificationAsRead(notificationId) {
  return requestJson(
    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
    "알림 읽음 처리에 실패했습니다."
  );
}

export async function markAllNotificationsAsRead(filter = "all") {
  return requestJson(
    `/api/notifications/read-all?filter=${encodeURIComponent(filter)}`,
    { method: "PATCH" },
    "전체 읽음 처리에 실패했습니다."
  );
}

export async function deleteAllNotifications(filter = "all") {
  return requestJson(
    `/api/notifications?filter=${encodeURIComponent(filter)}`,
    { method: "DELETE" },
    "알림 일괄 삭제에 실패했습니다."
  );
}

export async function deleteNotification(notificationId) {
  return requestJson(
    `/api/notifications/${encodeURIComponent(notificationId)}`,
    { method: "DELETE" },
    "알림 삭제에 실패했습니다."
  );
}
