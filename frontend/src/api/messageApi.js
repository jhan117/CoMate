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

export async function fetchConversations() {
  return requestJson(
    "/api/messages/conversations",
    { method: "GET" },
    "대화방 목록을 불러오지 못했습니다."
  );
}

export async function openOrCreateConversation({ recipientId, postId = "" }) {
  return requestJson(
    "/api/messages/conversations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: String(recipientId),
        ...(postId ? { postId: String(postId) } : {}),
      }),
    },
    "대화방을 열지 못했습니다."
  );
}

export async function fetchConversationDetail(conversationId) {
  return requestJson(
    `/api/messages/conversations/${encodeURIComponent(conversationId)}`,
    { method: "GET" },
    "대화 내역을 불러오지 못했습니다."
  );
}

export async function markConversationAsRead(conversationId) {
  return requestJson(
    `/api/messages/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: "PATCH" },
    "쪽지 읽음 처리에 실패했습니다."
  );
}

export async function createDirectMessage(conversationId, content) {
  return requestJson(
    `/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
    "쪽지 전송에 실패했습니다."
  );
}

export async function updateDirectMessage(messageId, content) {
  return requestJson(
    `/api/messages/${encodeURIComponent(messageId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
    "쪽지 수정에 실패했습니다."
  );
}

export async function deleteDirectMessage(messageId) {
  return requestJson(
    `/api/messages/${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
    "쪽지 삭제에 실패했습니다."
  );
}
