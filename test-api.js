// test-api.js
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api${path}`,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- Testing Auth and Tasks ---');
  const email = `test_${Date.now()}@example.com`;
  
  // 1. Register
  console.log('1. Registering user...');
  const regRes = await post('/auth/register', { name: 'Test User', email, password: 'password123' });
  console.log('Register response:', regRes.status, regRes.body);

  // 2. Login
  console.log('2. Logging in...');
  const loginRes = await post('/auth/login', { email, password: 'password123' });
  console.log('Login response:', loginRes.status, loginRes.body);
  const token = loginRes.body.token;

  // 3. Create Task
  console.log('3. Creating task with token...');
  const createRes = await post('/tasks', { title: 'First Task via Script', priority: 'high' }, token);
  console.log('Create task response:', createRes.status, createRes.body);

  // 4. Get Tasks
  console.log('4. Fetching tasks...');
  const getRes = await get('/tasks', token);
  console.log('Get tasks response:', getRes.status, JSON.stringify(getRes.body, null, 2));

  // 5. Get Stats
  console.log('5. Fetching stats...');
  const statsRes = await get('/tasks/stats', token);
  console.log('Get stats response:', statsRes.status, JSON.stringify(statsRes.body, null, 2));
}

run().catch(console.error);
