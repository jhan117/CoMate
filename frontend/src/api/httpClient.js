export async function requestJson(
  url,
  options = {},
  defaultErrorMessage = "요청에 실패했습니다."
) {
  const { json, headers, body, ...restOptions } = options;

  const res = await fetch(url, {
    credentials: "include",
    ...restOptions,
    headers:
      json !== undefined
        ? { "Content-Type": "application/json", ...headers }
        : headers,
    body: json !== undefined ? JSON.stringify(json) : body,
  });

  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || data === null) {
    const fallback =
      typeof defaultErrorMessage === "function"
        ? defaultErrorMessage(res.status)
        : defaultErrorMessage;
    const error = new Error(data?.message || fallback);
    error.status = res.status;
    throw error;
  }

  return data;
}
