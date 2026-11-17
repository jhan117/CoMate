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

export async function fetchPostApplicationData(postId) {
  return requestJson(
    `/api/applications?postId=${encodeURIComponent(postId)}`,
    { method: "GET" },
    "데이터를 불러오지 못했습니다."
  );
}

export async function createApplication(payload) {
  return requestJson(
    "/api/applications",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "지원서 제출에 실패했습니다."
  );
}

export async function resubmitApplication(applicationId, payload) {
  return requestJson(
    `/api/applications/${encodeURIComponent(applicationId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "지원서 수정 제출에 실패했습니다."
  );
}

export async function updateApplicationStatus(applicationId, status, feedback = "") {
  return requestJson(
    `/api/applications/${encodeURIComponent(applicationId)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    },
    "상태 변경에 실패했습니다."
  );
}

export async function cancelApplication(applicationId) {
  return requestJson(
    `/api/applications/${encodeURIComponent(applicationId)}`,
    { method: "DELETE" },
    "지원 취소에 실패했습니다."
  );
}
