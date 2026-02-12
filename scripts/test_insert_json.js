import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
function parseEnv(file) { const obj = {}; for (const line of file.split(/\r?\n/)) { const t=line.trim(); if (!t||t.startsWith('#')) continue; const idx=t.indexOf('='); if (idx===-1) continue; obj[t.slice(0,idx).trim()]=t.slice(idx+1).trim(); } return obj; }

function postForm(urlStr, token, params, timeout = 20000) {
  return new Promise((resolve,reject)=>{
    const urlObj = new URL(urlStr);
    const client = urlObj.protocol === 'https:' ? https : http;
    const data = params.toString();
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
        'X-JetopDebug-User': token
      },
      timeout
    };
    const req = client.request(urlObj, options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function run() {
  const env = parseEnv(fs.readFileSync(envPath,'utf8'));
  const base = env.VITE_API_BASE_URL;
  const token = env.VITE_AUTH_TOKEN;
  const handler = (base.endsWith('/')?base.slice(0,-1):base) + '/ks/sectionHandler.ashx';

  // Construct a realistic record matching MixCalculator.tsx mapping
  const rec = {
      sys_id: randomUUID(),
      created_at: new Date().toISOString(),
      strength_grade: 'C30',
      slump_mm: 180,
      max_size_mm: 20,
      region: 'Test Region',
      season: 'Test Season',
      fly_ash: 50,
      slag_powder: 30,
      notes: '测试脚本写入',
      input_json: JSON.stringify({test: 'form-data', mode: 'STD_SIMPLE'})
  };

  // Match structure: data={ updated: [rec] }
  // No 'mode' param in the request body
  const payload = { updated: [rec] };
  const jsonStr = JSON.stringify(payload);
  const base64Data = Buffer.from(jsonStr, 'utf8').toString('base64');
  
  const params = new URLSearchParams();
  params.append('id', '000b50bb-b343-9c74-898d-32927170539b');
  params.append('mode', 'update');
  params.append('_p_data', base64Data);

  console.log('Sending request to:', handler);
  console.log('Params:', params.toString());

  try {
    const resp = await postForm(handler, token, params);
    console.log('HTTP', resp.status);
    console.log('HEADERS:', resp.headers);
    console.log('BODY:', resp.body);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
