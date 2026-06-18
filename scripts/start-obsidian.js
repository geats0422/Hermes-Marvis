import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'obsidian-server.js');
const vaultPath = process.argv[2] || 'C:\\work\\Huanyu Hub\\Huanyu-Knowledge';

const child = spawn('node', [serverPath, vaultPath], {
  stdio: 'inherit',
  detached: true,
});

child.unref();
console.log(`Started Obsidian server (PID: ${child.pid})`);
