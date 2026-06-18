export interface WindowsDrive {
  Letter: string;
  Label: string;
  UsedGB: number;
  TotalGB: number;
  FreeGB: number;
  Health: string;
}

export interface WslDistro {
  name: string;
  state: string;
  version: string;
  is_default: boolean;
}

export interface WslMount {
  filesystem: string;
  size_bytes: number;
  used_bytes: number;
  avail_bytes: number;
  used_pct: number;
  mount: string;
}

const CRON_API_KEY = import.meta.env.VITE_CRON_API_KEY as string | undefined;

async function request<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (CRON_API_KEY) headers['Authorization'] = `Bearer ${CRON_API_KEY}`;
  const res = await fetch(`/cron-api/system${path}`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`System API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getDrives(): Promise<{ drives: WindowsDrive[] }> {
  return request('/drives');
}

export async function getWslDistros(): Promise<{ distros: WslDistro[] }> {
  return request('/wsl');
}

export async function getWslFilesystems(): Promise<{ mounts: WslMount[] }> {
  return request('/wsl-fs');
}
