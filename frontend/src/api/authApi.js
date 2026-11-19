import { emitActiveUserChanged } from '../constants/notificationConstants';
import { requestJson } from './httpClient';

async function mutateAuth(path, fields) {
  const data = await requestJson(
    `/api/auth/${path}`,
    {
      method: 'POST',
      ...(fields !== undefined ? { json: fields } : {}),
    },
    (status) => `인증 요청에 실패했습니다. (${status})`
  );

  const user = data?.user ?? null;
  emitActiveUserChanged(user);
  return user;
}

export async function fetchCurrentUser() {
  const data = await requestJson(
    '/api/auth/me',
    {},
    (status) => `인증 요청에 실패했습니다. (${status})`
  );
  return data?.user ?? null;
}

export const signup = (fields) => mutateAuth('signup', fields);
export const login = (fields) => mutateAuth('login', fields);
export const logout = () => mutateAuth('logout');
