import { requestJson } from './httpClient';

function requestPost(path = '', options = {}) {
  return requestJson(
    `/api/posts${path}`,
    options,
    (status) => `모집글 요청에 실패했습니다. (${status})`
  );
}

export const fetchPosts = () => requestPost();

export function savePost(id, fields) {
  return requestPost(id ? `/${encodeURIComponent(id)}` : '', {
    method: id ? 'PUT' : 'POST',
    json: fields,
  });
}

export function deletePost(id) {
  return requestPost(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}