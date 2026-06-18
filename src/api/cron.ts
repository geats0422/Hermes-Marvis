export interface CronJob {
  id: string;
  name: string | null;
  prompt: string;
  skills: string[];
  skill: string | null;
  schedule: {
    kind: 'cron' | 'interval' | 'once' | string;
    expr: string;
    display: string;
  };
  schedule_display: string;
  repeat: { times: number | null; completed: number };
  enabled: boolean;
  state: 'scheduled' | 'paused' | string;
  paused_at: string | null;
  created_at: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: 'ok' | 'error' | string | null;
  last_error: string | null;
  deliver: string;
}

export interface CronJobsResponse {
  jobs: CronJob[];
  updated_at: string | null;
}

export interface CreateJobPayload {
  name: string;
  prompt: string;
  schedule: string;
  deliver?: string;
  repeat?: number;
  skills?: string[];
}

const CRON_API_KEY = import.meta.env.VITE_CRON_API_KEY as string | undefined;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (CRON_API_KEY) headers['Authorization'] = `Bearer ${CRON_API_KEY}`;
  const res = await fetch(`/cron-api${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cron API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function listCronJobs(): Promise<CronJobsResponse> {
  return request<CronJobsResponse>('/jobs');
}

export async function createCronJob(payload: CreateJobPayload): Promise<{ ok: boolean; error?: string; stdout?: string; stderr?: string }> {
  return request('/jobs', { method: 'POST', body: JSON.stringify(payload) });
}

export async function pauseCronJob(id: string): Promise<{ ok: boolean; error?: string }> {
  return request(`/jobs/${id}/pause`, { method: 'POST' });
}

export async function resumeCronJob(id: string): Promise<{ ok: boolean; error?: string }> {
  return request(`/jobs/${id}/resume`, { method: 'POST' });
}

export async function runCronJob(id: string): Promise<{ ok: boolean; error?: string }> {
  return request(`/jobs/${id}/run`, { method: 'POST' });
}

export async function deleteCronJob(id: string): Promise<{ ok: boolean; error?: string }> {
  return request(`/jobs/${id}`, { method: 'DELETE' });
}

export async function editCronJob(
  id: string,
  payload: { name?: string; prompt?: string; schedule?: string },
): Promise<{ ok: boolean; error?: string }> {
  return request(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
