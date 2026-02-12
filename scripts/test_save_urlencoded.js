import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function parseEnv(file) {
  const obj = {};
  const lines = file.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    obj[key] = val;
  }
  return obj;
}

function post(urlStr, headers, body, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const client = urlObj.protocol === 'https:' ? https : http;
    const options = {
      method: 'POST',
      headers,
      timeout,
    };
    const req = client.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

async function run() {
  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  const base = env.VITE_API_BASE_URL || 'http://localhost:5173/jetopcms';
  const token = env.VITE_AUTH_TOKEN;
  const handler = (base.endsWith('/') ? base.slice(0, -1) : base) + '/ks/sectionHandler.ashx';

  const sample = { id: 'test-save-script', timestamp: Date.now(), mode: 'STD_SIMPLE', formData: { grade: 'C40' }, result: { cement: 200 } };
  const sysId = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now();
  const record = { sys_id: sysId, input_json: JSON.stringify(sample) };
  const payload = { id: '000b50bb-b343-9c74-898d-32927170539b', mode: 'insert', inserted: [record] };
  const body = JSON.stringify(payload);

  try {
    const resp = await post(handler, {
      'X-JetopDebug-User': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body, 'utf8')
    }, body);
    console.log('HTTP', resp.status);
    console.log('BODY:', resp.body);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
