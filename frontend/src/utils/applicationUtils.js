export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSeoulDateKey(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export function getDeadlineMeta(deadline) {
  if (!deadline) {
    return { label: "", variant: "open", isClosed: false };
  }
  const today = getSeoulDateKey(new Date());
  const days = Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);

  if (!Number.isFinite(days)) {
    return { label: "", variant: "open", isClosed: false };
  }
  if (days < 0) {
    return { label: "마감", variant: "closed", isClosed: true };
  }
  if (days === 0) {
    return { label: "D-day", variant: "urgent", isClosed: false };
  }
  if (days <= 3) {
    return { label: `D-${days}`, variant: "soon", isClosed: false };
  }
  return { label: `D-${days}`, variant: "open", isClosed: false };
}

export function formatFullDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTimeOnly(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return formatDate(iso);
}

export function isDeptFull(dept) {
  if (!dept) return false;
  return dept.currentMembers >= dept.maxMembers;
}

export function getFirstAvailableDeptName(departments = []) {
  return departments.find((d) => !isDeptFull(d))?.deptName || "";
}
