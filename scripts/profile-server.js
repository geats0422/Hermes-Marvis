import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 8645;
const HERMES_HOME = process.env.HERMES_HOME || 'C:\\Users\\kabuto\\.hermes';
const HERMES_SOURCE_DIR = process.env.HERMES_SOURCE_DIR || 'C:\\work\\Huanyu Hub\\Hermes source\\hermes-agent';
const PROFILES_DIR = path.join(HERMES_HOME, 'profiles');
const MEMORIES_DIR = path.join(HERMES_HOME, 'memories');
const GLOBAL_ENABLED_FILE = path.join(HERMES_HOME, 'marvis_global_skills.json');
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

function loadGlobalEnabled() {
  try {
    const data = JSON.parse(fs.readFileSync(GLOBAL_ENABLED_FILE, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveGlobalEnabled(skills) {
  fs.writeFileSync(GLOBAL_ENABLED_FILE, JSON.stringify(skills, null, 2));
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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { status: 'ok', home: HERMES_HOME });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/global-skills') {
    const globalSkillsDir = path.join(HERMES_HOME, 'skills');
    if (!fs.existsSync(globalSkillsDir)) {
      json(res, 200, { skills: [] });
      return;
    }
    const entries = fs.readdirSync(globalSkillsDir, { withFileTypes: true });
    const skills = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => {
        const dirPath = path.join(globalSkillsDir, e.name);
        const description = parseSkillDescription(dirPath) || '';
        return { id: e.name, name: e.name, description };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    json(res, 200, { skills });
    return;
  }

  if (url.pathname === '/global-skills-enabled') {
    if (req.method === 'GET') {
      json(res, 200, { enabled: loadGlobalEnabled() });
      return;
    }
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (url.pathname.startsWith('/global-skills-enabled/') && parts.length === 2) {
    const skillId = parts[1];
    if (!/^[a-zA-Z0-9._-]+$/.test(skillId)) {
      json(res, 400, { error: 'Invalid skill id' });
      return;
    }
    if (req.method === 'POST') {
      const list = loadGlobalEnabled();
      if (!list.includes(skillId)) {
        list.push(skillId);
        saveGlobalEnabled(list);
      }
      json(res, 200, { enabled: list });
      return;
    }
    if (req.method === 'DELETE') {
      const list = loadGlobalEnabled().filter((s) => s !== skillId);
      saveGlobalEnabled(list);
      json(res, 200, { enabled: list });
      return;
    }
    json(res, 405, { error: 'Method not allowed' });
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

    if (resource === 'skills' && parts.length === 2) {
      json(res, 200, { skills: listSkills(agentId) });
      return;
    }

    if (resource === 'skills' && parts.length === 3) {
      if (req.method === 'GET') {
        json(res, 405, { error: 'Method not allowed' });
        return;
      }
      const skillId = parts[2];
      let globalSkillDir = path.join(HERMES_HOME, 'skills', skillId);
      if (!fs.existsSync(globalSkillDir)) {
        globalSkillDir = path.join(HERMES_SOURCE_DIR, 'skills', skillId);
      }
      if (!fs.existsSync(globalSkillDir)) {
        json(res, 404, { error: 'Global skill not found' });
        return;
      }
      if (req.method === 'POST') {
        const agentSkillsDir = path.join(getProfileDir(agentId), 'skills');
        if (!fs.existsSync(agentSkillsDir)) fs.mkdirSync(agentSkillsDir, { recursive: true });
        const target = path.join(agentSkillsDir, skillId);
        if (!fs.existsSync(target)) {
          try { fs.cpSync(globalSkillDir, target, { recursive: true }); }
          catch (e) { json(res, 500, { error: e.message }); return; }
        }
        json(res, 200, { enabled: true, skillId });
        return;
      }
      if (req.method === 'DELETE') {
        const agentSkillsDir = path.join(getProfileDir(agentId), 'skills');
        const target = path.join(agentSkillsDir, skillId);
        if (fs.existsSync(target)) {
          fs.rmSync(target, { recursive: true, force: true });
        }
        json(res, 200, { enabled: false, skillId });
        return;
      }
      json(res, 405, { error: 'Method not allowed' });
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
