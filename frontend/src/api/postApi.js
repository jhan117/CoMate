async function request(path = '', { method = 'GET', fields } = {}) {
  const response = await fetch(`/api/posts${path}`, {
    method,
    headers: fields ? { 'Content-Type': 'application/json' } : undefined,
    body: fields ? JSON.stringify(fields) : undefined,
  });

  if (response.status === 204) return;

  const data = await response.json().catch(() => null);

  if (!response.ok || data === null) {
    throw new Error(data?.message ?? `모집글 요청에 실패했습니다. (${response.status})`);
  }

  return data;
}

export const fetchPosts = () => request();

export function savePost(id, fields) {
  return request(id ? `/${encodeURIComponent(id)}` : '', {
    method: id ? 'PUT' : 'POST',
    fields,
  });
}

export function deletePost(id) {
  return request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}