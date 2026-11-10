export async function fetchPostApplicationData(postId) {
  const res = await fetch(`/api/applications?postId=${encodeURIComponent(postId)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "데이터를 불러오지 못했습니다.");
  }
  return data;
}

export async function createApplication(payload) {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "지원서 제출에 실패했습니다.");
  }
  return data;
}

export async function resubmitApplication(applicationId, payload) {
  const res = await fetch(`/api/applications/${applicationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "지원서 수정 제출에 실패했습니다.");
  }
  return data;
}

export async function updateApplicationStatus(applicationId, status, feedback = "") {
  const res = await fetch(`/api/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, feedback }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "상태 변경에 실패했습니다.");
  }
  return data;
}

export async function cancelApplication(applicationId) {
  const res = await fetch(`/api/applications/${applicationId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "지원 취소에 실패했습니다.");
  }
  return data;
}
