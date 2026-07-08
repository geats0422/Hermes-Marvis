import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 8645;
const HERMES_HOME = process.env.HERMES_HOME || 'C:\\Users\\kabuto\\.hermes';
const PROFILES_DIR = path.join(HERMES_HOME, 'profiles');
const MEMORIES_DIR = path.join(HERMES_HOME, 'memories');
const ALLOWED_ORIGIN = process.env.PROFILE_ALLOWED_ORIGIN || 'http://localhost:5173';

const AGENT_ID_MAP = {
  shoufu: 'shoufu',
  libu: 'libu',
  hubu: 'hubu',
  libu2: 'libu-2',
  bingbu: 'bingbu',
  xingbu: 'xingbu',
  gongbu: 'gongbu',
  cangbu: 'cangbu',
  yibu: 'yibu',
};

const ALLOWED_AGENTS = new Set(Object.keys(AGENT_ID_MAP));
const ALLOWED_MEMORY_FILES = new Set(['MEMORY.md', 'USER.md']);

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function text(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(data);
}

function isValidAgentId(agentId) {
  return ALLOWED_AGENTS.has(agentId);
}

function getProfileDir(agentId) {
  const profileName = AGENT_ID_MAP[agentId];
  return path.join(PROFILES_DIR, profileName);
}

function safeProfilePath(agentId, subPath) {
  const profileDir = getProfileDir(agentId);
  const fullPath = path.resolve(path.join(profileDir, subPath));
  const normalizedRoot = path.resolve(profileDir) + path.sep;
  if (fullPath !== profileDir && !fullPath.startsWith(normalizedRoot)) {
    return null;
  }
  return fullPath;
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function safeTail(filePath, limit = 100) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    return lines.slice(-limit);
  } catch {
    return [];
  }
}

function parseLogLine(line) {
  const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+(\w+)\s+(.+)$/);
  if (!match) return { time: '', level: 'INFO', message: line };
  return { time: match[1], level: match[2], message: match[3] };
}

function parseSkillDescription(dirPath) {
  const descPath = path.join(dirPath, 'DESCRIPTION.md');
  const content = readText(descPath);
  if (!content) return null;
  const match = content.match(/description:\s*(.+)/);
  return match ? match[1].trim() : content.trim();
}

function listSkills(agentId) {
  const skillsDir = safeProfilePath(agentId, 'skills');
  if (!skillsDir || !fs.existsSync(skillsDir)) return [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dirPath = path.join(skillsDir, e.name);
      const description = parseSkillDescription(dirPath) || '';
      return {
        id: e.name,
        name: e.name,
        description,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getProfileInfo(agentId) {
  const profileDir = getProfileDir(agentId);
  const exists = fs.existsSync(profileDir);
  if (!exists) return { agentId, exists: false, soulLength: 0, skillCount: 0, updatedAt: 0 };
  const soulPath = path.join(profileDir, 'SOUL.md');
  const stat = fs.existsSync(soulPath) ? fs.statSync(soulPath) : null;
  const skills = listSkills(agentId);
  return {
    agentId,
    exists: true,
    soulLength: stat ? fs.readFileSync(soulPath, 'utf-8').length : 0,
    skillCount: skills.length,
    updatedAt: stat ? stat.mtime.getTime() : 0,
  };
}

function readProfileFile(agentId, fileName) {
  const fullPath = safeProfilePath(agentId, fileName);
  if (!fullPath) return null;
  return readText(fullPath);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ALLOWED_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { status: 'ok', home: HERMES_HOME });
    return;
  }

  if (req.method === 'GET' && parts[0] === 'memories' && parts.length === 2) {
    const fileName = parts[1];
    if (!ALLOWED_MEMORY_FILES.has(fileName)) {
      json(res, 403, { error: 'Memory file not allowed' });
      return;
    }
    const filePath = path.join(MEMORIES_DIR, fileName);
    const normalizedRoot = path.resolve(MEMORIES_DIR) + path.sep;
    const fullPath = path.resolve(filePath);
    if (!fullPath.startsWith(normalizedRoot)) {
      json(res, 403, { error: 'Access denied' });
      return;
    }
    const content = readText(fullPath);
    if (content === null) {
      json(res, 404, { error: 'File not found' });
      return;
    }
    json(res, 200, { name: fileName, content });
    return;
  }

  if (parts.length >= 2 && isValidAgentId(parts[0])) {
    const agentId = parts[0];
    const resource = parts[1];

    if (req.method !== 'GET') {
      json(res, 405, { error: 'Method not allowed' });
      return;
    }

    const profileDir = getProfileDir(agentId);
    if (!fs.existsSync(profileDir)) {
      json(res, 404, { error: 'Agent profile not found' });
      return;
    }

    if (resource === 'info') {
      json(res, 200, getProfileInfo(agentId));
      return;
    }

    if (resource === 'SOUL.md' || resource === 'config.yaml' || resource === 'env') {
      const fileName = resource === 'env' ? '.env' : resource;
      const content = readProfileFile(agentId, fileName);
      if (content === null) {
        json(res, 404, { error: 'File not found' });
        return;
      }
      json(res, 200, { name: fileName, content });
      return;
    }

    if (resource === 'skills') {
      json(res, 200, { skills: listSkills(agentId) });
      return;
    }

    if (resource === 'logs') {
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const logPath = safeProfilePath(agentId, 'logs/agent.log');
      if (!logPath) {
        json(res, 403, { error: 'Access denied' });
        return;
      }
      const lines = safeTail(logPath, limit).map(parseLogLine);
      json(res, 200, { lines });
      return;
    }

    json(res, 404, { error: 'Resource not found' });
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Profile API Server running at http://localhost:${PORT}`);
  console.log(`Profiles: ${PROFILES_DIR}`);
  console.log(`Allowed agents: ${Array.from(ALLOWED_AGENTS).join(', ')}`);
});
