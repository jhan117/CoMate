export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isDeptFull(dept) {
  if (!dept) return false;
  return dept.currentMembers >= dept.maxMembers;
}

export function getFirstAvailableDeptName(departments = []) {
  return (
    departments.find((d) => !isDeptFull(d))?.deptName ||
    departments[0]?.deptName ||
    ""
  );
}
