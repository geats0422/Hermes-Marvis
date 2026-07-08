import net from 'net';
import { spawn } from 'child_process';

const POLL_MS = 2000;
const RESTART_DELAY_MS = 1000;

const SERVICES = [
  { name: 'profile-server', port: 8645, cmd: ['node', 'scripts/profile-server.js'] },
  { name: 'obsidian-server', port: 8643, cmd: ['node', 'scripts/obsidian-server.js', 'C:\\work\\Huanyu Hub\\Huanyu-Knowledge\\'] },
  { name: 'cron-server', port: 8644, cmd: ['python', 'scripts/cron-server.py'] },
  {
    name: 'hermes-gateway',
    port: 8642,
    cmd: ['C:\\work\\Huanyu Hub\\Hermes source\\hermes-agent\\huanyu-hermes\\Scripts\\hermes.exe', 'gateway', 'run'],
  },
];

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(false));
    socket.connect(port, host);
  });
}

async function waitForPortFree(port) {
  while (await isPortInUse(port)) {
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

async function supervise(svc) {
  while (true) {
    if (await isPortInUse(svc.port)) {
      console.log(`[${svc.name}] :${svc.port} already in use, watching for crash...`);
      await waitForPortFree(svc.port);
      console.log(`[${svc.name}] :${svc.port} became free`);
    }
    console.log(`[${svc.name}] :${svc.port} free, starting...`);
    const child = spawn(svc.cmd[0], svc.cmd.slice(1), {
      stdio: 'inherit',
      windowsHide: true,
    });
    const exitInfo = await new Promise((resolve) => {
      child.on('exit', (code, signal) => resolve({ code: code ?? 0, signal }));
    });
    console.log(`[${svc.name}] exited (code=${exitInfo.code}${exitInfo.signal ? `, signal=${exitInfo.signal}` : ''})`);
    await new Promise((r) => setTimeout(r, RESTART_DELAY_MS));
  }
}

await Promise.all(SERVICES.map(supervise));
