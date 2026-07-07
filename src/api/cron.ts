import { request } from './hermes';

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
}

export interface CreateJobPayload {
  name: string;
  prompt: string;
  schedule: string;
  deliver?: string;
  repeat?: number;
  skills?: string[];
}

export async function listCronJobs(): Promise<CronJobsResponse> {
  return request<CronJobsResponse>('/api/jobs');
}

export async function createCronJob(payload: CreateJobPayload): Promise<{ job: CronJob }> {
  return request<{ job: CronJob }>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function pauseCronJob(id: string): Promise<{ job: CronJob }> {
  return request<{ job: CronJob }>(`/api/jobs/${id}/pause`, { method: 'POST' });
}

export async function resumeCronJob(id: string): Promise<{ job: CronJob }> {
  return request<{ job: CronJob }>(`/api/jobs/${id}/resume`, { method: 'POST' });
}

export async function runCronJob(id: string): Promise<{ job: CronJob }> {
  return request<{ job: CronJob }>(`/api/jobs/${id}/run`, { method: 'POST' });
}

export async function deleteCronJob(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/jobs/${id}`, { method: 'DELETE' });
}

export async function editCronJob(
  id: string,
  payload: { name?: string; prompt?: string; schedule?: string; enabled?: boolean; deliver?: string },
): Promise<{ job: CronJob }> {
  return request<{ job: CronJob }>(`/api/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
