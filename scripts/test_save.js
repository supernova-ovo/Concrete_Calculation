import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

async function run() {
  if (!fs.existsSync(envPath)) {
    console.error('.env not found at', envPath);
    process.exit(1);
  }
  const envText = fs.readFileSync(envPath, 'utf8');
  const env = parseEnv(envText);
  const base = env.VITE_API_BASE_URL || 'http://localhost:5173/jetopcms';
  const token = env.VITE_AUTH_TOKEN;
  if (!token) {
    console.error('VITE_AUTH_TOKEN not set in .env');
    process.exit(1);
  }
  const handler = (base.endsWith('/') ? base.slice(0, -1) : base) + '/ks/sectionHandler.ashx';

  const sample = {
    id: 'test-save-script',
    timestamp: Date.now(),
    mode: 'STD_SIMPLE',
    formData: { grade: 'C40', slump: 180 },
    result: { cement: 200, water: 180 }
  };
  const sysId = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=> (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16));

  const record = { sys_id: sysId, input_json: JSON.stringify(sample) };
  const payload = { id: '000b50bb-b343-9c74-898d-32927170539b', mode: 'insert', inserted: [record] };

  console.log('POST', handler);
  console.log('Using token length', token.length);

  try {
    const res = await fetch(handler, {
      method: 'POST',
      headers: {
        'X-JetopDebug-User': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    console.log('HTTP status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
