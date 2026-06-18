import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!process.env[key]) {
      process.env[key] = trimmed.slice(eqIdx + 1).trim();
    }
  }
}

const VAULT_PATH = process.argv[2] || 'C:\\work\\Huanyu Hub\\Huanyu-Knowledge';
const PORT = 8643;
const ALLOWED_ORIGIN = process.env.OBSIDIAN_ALLOWED_ORIGIN || 'http://localhost:5173';

const WRITE_ROLES = new Set(['shoufu', 'cangbu']);

function getFileTree(dir, basePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const tree = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      tree.push({
        name: entry.name,
        path: relPath,
        type: 'folder',
        children: getFileTree(fullPath, relPath),
      });
    } else if (entry.name.endsWith('.md')) {
      const stat = fs.statSync(fullPath);
      tree.push({
        name: entry.name,
        path: relPath,
        type: 'doc',
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
    }
  }

  return tree;
}

function getFileContent(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function safePath(relPath) {
  const normalizedRoot = path.resolve(VAULT_PATH) + path.sep;
  const fullPath = path.resolve(path.join(VAULT_PATH, relPath));
  if (fullPath !== normalizedRoot.slice(0, -1) && !fullPath.startsWith(normalizedRoot) && !(fullPath + path.sep).startsWith(normalizedRoot)) {
    return null;
  }
  return fullPath;
}

function checkWriteRole(req) {
  const role = req.headers['x-agent-role'] || '';
  return WRITE_ROLES.has(role);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ALLOWED_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Agent-Role');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/tree') {
    const tree = getFileTree(VAULT_PATH);
    res.end(JSON.stringify({ vault: path.basename(VAULT_PATH), path: VAULT_PATH, tree }));
  } else if (url.pathname === '/api/health') {
    res.end(JSON.stringify({ status: 'ok', vault: VAULT_PATH }));
  } else if (req.method === 'GET' && url.pathname.startsWith('/api/file/')) {
    const relPath = decodeURIComponent(url.pathname.slice('/api/file/'.length));
    const fullPath = safePath(relPath);
    if (!fullPath) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return; }
    if (!fullPath.endsWith('.md')) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Only .md files' })); return; }
    try {
      const content = getFileContent(fullPath);
      const stat = fs.statSync(fullPath);
      res.end(JSON.stringify({ name: path.basename(fullPath), path: relPath, content, size: stat.size, updatedAt: stat.mtime.toISOString() }));
    } catch { res.statusCode = 404; res.end(JSON.stringify({ error: 'File not found' })); }

  } else if (req.method === 'POST' && url.pathname === '/api/file') {
    if (!checkWriteRole(req)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Permission denied: only 首辅/仓部 can create files' })); return; }
    try {
      const body = JSON.parse(await readBody(req));
      const { path: relPath, content = '' } = body;
      if (!relPath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'path is required' })); return; }
      const fullPath = safePath(relPath);
      if (!fullPath) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return; }
      if (!fullPath.endsWith('.md')) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Only .md files' })); return; }
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(fullPath)) { res.statusCode = 409; res.end(JSON.stringify({ error: 'File already exists' })); return; }
      fs.writeFileSync(fullPath, content, 'utf-8');
      const stat = fs.statSync(fullPath);
      res.statusCode = 201;
      res.end(JSON.stringify({ name: path.basename(fullPath), path: relPath, size: stat.size, updatedAt: stat.mtime.toISOString() }));
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }

  } else if (req.method === 'PUT' && url.pathname.startsWith('/api/file/')) {
    if (!checkWriteRole(req)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Permission denied: only 首辅/仓部 can edit files' })); return; }
    try {
      const relPath = decodeURIComponent(url.pathname.slice('/api/file/'.length));
      const body = JSON.parse(await readBody(req));
      const { content } = body;
      if (typeof content !== 'string') { res.statusCode = 400; res.end(JSON.stringify({ error: 'content string is required' })); return; }
      const fullPath = safePath(relPath);
      if (!fullPath) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return; }
      if (!fullPath.endsWith('.md')) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Only .md files' })); return; }
      if (!fs.existsSync(fullPath)) { res.statusCode = 404; res.end(JSON.stringify({ error: 'File not found' })); return; }
      fs.writeFileSync(fullPath, content, 'utf-8');
      const stat = fs.statSync(fullPath);
      res.end(JSON.stringify({ name: path.basename(fullPath), path: relPath, size: stat.size, updatedAt: stat.mtime.toISOString() }));
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }

  } else if (req.method === 'DELETE' && url.pathname.startsWith('/api/file/')) {
    if (!checkWriteRole(req)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Permission denied: only 首辅/仓部 can delete files' })); return; }
    try {
      const relPath = decodeURIComponent(url.pathname.slice('/api/file/'.length));
      const fullPath = safePath(relPath);
      if (!fullPath) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return; }
      if (!fullPath.endsWith('.md')) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Only .md files' })); return; }
      if (!fs.existsSync(fullPath)) { res.statusCode = 404; res.end(JSON.stringify({ error: 'File not found' })); return; }
      fs.unlinkSync(fullPath);
      res.end(JSON.stringify({ deleted: relPath }));
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }

  } else if (req.method === 'POST' && url.pathname === '/api/folder') {
    if (!checkWriteRole(req)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Permission denied: only 首辅/仓部 can create folders' })); return; }
    try {
      const body = JSON.parse(await readBody(req));
      const { path: relPath } = body;
      if (!relPath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'path is required' })); return; }
      const fullPath = safePath(relPath);
      if (!fullPath) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return; }
      if (fs.existsSync(fullPath)) { res.statusCode = 409; res.end(JSON.stringify({ error: 'Folder already exists' })); return; }
      fs.mkdirSync(fullPath, { recursive: true });
      res.statusCode = 201;
      res.end(JSON.stringify({ created: relPath, type: 'folder' }));
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }

  } else if (req.method === 'DELETE' && url.pathname.startsWith('/api/folder/')) {
    if (!checkWriteRole(req)) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Permission denied: only 首辅/仓部 can delete folders' })); return; }
    try {
      const relPath = decodeURIComponent(url.pathname.slice('/api/folder/'.length));
      const fullPath = safePath(relPath);
      if (!fullPath) { res.statusCode = 403; res.end(JSON.stringify({ error: 'Access denied' })); return; }
      if (!fs.existsSync(fullPath)) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Folder not found' })); return; }
      const items = fs.readdirSync(fullPath);
      if (items.length > 0) { res.statusCode = 409; res.end(JSON.stringify({ error: 'Folder not empty' })); return; }
      fs.rmdirSync(fullPath);
      res.end(JSON.stringify({ deleted: relPath }));
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }

  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Obsidian API Server running at http://localhost:${PORT}`);
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Allowed origin: ${ALLOWED_ORIGIN}`);
});
