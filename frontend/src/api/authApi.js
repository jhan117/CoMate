import { emitActiveUserChanged } from '../constants/notificationConstants';

async function request(path, method = 'GET', fields) {
  const response = await fetch(`/api/auth/${path}`, {
    method,
    headers: fields ? { 'Content-Type': 'application/json' } : undefined,
    body: fields ? JSON.stringify(fields) : undefined,
  });

  if (response.status === 204) {
    emitActiveUserChanged(null);
    return;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || data === null) {
    throw new Error(data?.message ?? `인증 요청에 실패했습니다. (${response.status})`);
  }

  emitActiveUserChanged(data.user ?? null);
  return data.user;
}

export const fetchCurrentUser = () => request('me');
export const signup = (fields) => request('signup', 'POST', fields);
export const login = (fields) => request('login', 'POST', fields);
export const logout = () => request('logout', 'POST');
