import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
function parseEnv(file) { const obj = {}; for (const line of file.split(/\r?\n/)) { const t=line.trim(); if (!t||t.startsWith('#')) continue; const idx=t.indexOf('='); if (idx===-1) continue; obj[t.slice(0,idx).trim()]=t.slice(idx+1).trim(); } return obj; }

function buildMultipart(fields) {
  const boundary = `----FormBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
  const parts = [];
  for (const [k,v] of Object.entries(fields)){
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="${k}"\r\n\r\n`);
    parts.push(`${v}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  return { boundary, body: parts.join('') };
}

function httpsRequest(url, headers, postData) {
  return new Promise((resolve,reject)=>{
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers,
      rejectUnauthorized: false
    };
    const req = https.request(opts, (res)=>{
      let data='';
      res.on('data', c=>data+=c);
      res.on('end', ()=>resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', e=>reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run(){
  const env = parseEnv(fs.readFileSync(envPath,'utf8'));
  const base = env.VITE_API_BASE_URL;
  const token = env.VITE_AUTH_TOKEN;
  const handler = (base.endsWith('/')?base.slice(0,-1):base) + '/ks/sectionHandler.ashx';

  const sample = { id: 'script-insert', timestamp: Date.now(), mode: 'STD_SIMPLE', formData: { grade: 'C40' }, result: { cement: 200 } };
  const sysId = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now();
  const record = { sys_id: sysId, input_json: JSON.stringify(sample) };
  const payload = { id: '000b50bb-b343-9c74-898d-32927170539b', mode: 'insert', inserted: [record] };
  const data = JSON.stringify(payload);
  const headers = {
    'X-JetopDebug-User': token,
    'host': 'localhost',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  };

  try{
    const resp = await httpsRequest(handler, headers, data);
    console.log('HTTP', resp.status);
    console.log('BODY:', resp.body);
  } catch(err){ console.error('Error:', err); }
}

run();
