const { spawn } = require('node:child_process');
const path = require('node:path');

const DEFAULT_PORT = 3451;

async function isServerUp(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(baseUrl, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerUp(baseUrl)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`서버가 ${timeoutMs}ms 내에 준비되지 않았습니다: ${baseUrl}`);
}

async function withServer(fn) {
  const explicitUrl = process.env.TEST_BASE_URL;
  if (explicitUrl) {
    return fn(explicitUrl);
  }

  const defaultUrl = 'http://localhost:3000';
  if (await isServerUp(defaultUrl)) {
    return fn(defaultUrl);
  }

  const port = process.env.TEST_PORT || DEFAULT_PORT;
  const baseUrl = `http://127.0.0.1:${port}`;
  const backendDir = path.resolve(__dirname, '..', 'backend');

  const server = spawn(process.execPath, ['server.js'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  server.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForHealth(baseUrl);
    return await fn(baseUrl);
  } catch (error) {
    if (stderr) {
      console.error('테스트 서버 stderr:\n', stderr);
    }
    throw error;
  } finally {
    server.kill();
  }
}

async function request(baseUrl, targetPath, options = {}, cookie = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(`${baseUrl}${targetPath}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get('set-cookie');
  const data = await res.json().catch(() => null);

  return {
    status: res.status,
    data,
    cookie: setCookie ? setCookie.split(';')[0] : cookie,
  };
}

async function loginAs(baseUrl, email, password) {
  const res = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res;
}

module.exports = {
  withServer,
  request,
  loginAs,
};
