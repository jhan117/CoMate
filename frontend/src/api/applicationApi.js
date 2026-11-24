import { requestJson } from "./httpClient";

export async function fetchPostApplicationData(postId) {
  return requestJson(
    `/api/applications?postId=${encodeURIComponent(postId)}`,
    { method: "GET" },
    "데이터를 불러오지 못했습니다."
  );
}

export async function fetchMyApplicationOverview() {
  return requestJson(
    "/api/applications/overview",
    { method: "GET" },
    "내 모집·지원 현황을 불러오지 못했습니다."
  );
}

export async function createApplication(payload) {
  return requestJson(
    "/api/applications",
    {
      method: "POST",
      json: payload,
    },
    "지원서 제출에 실패했습니다."
  );
}

export async function resubmitApplication(applicationId, payload) {
  return requestJson(
    `/api/applications/${encodeURIComponent(applicationId)}`,
    {
      method: "PUT",
      json: payload,
    },
    "지원서 수정 제출에 실패했습니다."
  );
}

export async function updateApplicationStatus(applicationId, status, feedback = "") {
  return requestJson(
    `/api/applications/${encodeURIComponent(applicationId)}/status`,
    {
      method: "PATCH",
      json: { status, feedback },
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
