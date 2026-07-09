import type { SkillCollectionsResponse } from '../types/skills';

export interface AgentProfileInfo {
  agentId: string;
  exists: boolean;
  soulLength: number;
  skillCount: number;
  updatedAt: number;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
}

export interface AgentLogLine {
  time: string;
  level: string;
  message: string;
}

export interface TextFile {
  name: string;
  content: string;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/profile-api${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getAgentProfileInfo(agentId: string): Promise<AgentProfileInfo> {
  return request(`/${agentId}/info`);
}

export async function getAgentSoul(agentId: string): Promise<TextFile> {
  return request(`/${agentId}/SOUL.md`);
}

export async function getAgentConfig(agentId: string): Promise<TextFile> {
  return request(`/${agentId}/config.yaml`);
}

export async function getAgentEnv(agentId: string): Promise<TextFile> {
  return request(`/${agentId}/env`);
}

export async function getAgentSkills(agentId: string): Promise<AgentSkill[]> {
  const data = await request<{ skills: AgentSkill[] }>(`/${agentId}/skills`);
  return data.skills;
}

export async function getAgentLogs(agentId: string, limit = 100): Promise<AgentLogLine[]> {
  const data = await request<{ lines: AgentLogLine[] }>(`/${agentId}/logs?limit=${limit}`);
  return data.lines;
}

export async function getGlobalMemory(name: 'MEMORY.md' | 'USER.md'): Promise<TextFile> {
  return request(`/memories/${name}`);
}

export async function getGlobalSkills(): Promise<AgentSkill[]> {
  const data = await request<{ skills: AgentSkill[] }>('/global-skills');
  return data.skills;
}

export async function getSkillCollections(): Promise<SkillCollectionsResponse> {
  return request('/skill-collections');
}

export async function getGlobalEnabledSkills(): Promise<string[]> {
  const data = await request<{ enabled: string[] }>('/global-skills-enabled');
  return data.enabled;
}

export async function enableGlobalSkill(skillId: string): Promise<string[]> {
  const data = await mutateRequest<{ enabled: string[] }>(`/global-skills-enabled/${skillId}`, 'POST');
  return data.enabled;
}

export async function disableGlobalSkill(skillId: string): Promise<string[]> {
  const data = await mutateRequest<{ enabled: string[] }>(`/global-skills-enabled/${skillId}`, 'DELETE');
  return data.enabled;
}

async function mutateRequest<T>(path: string, method: string): Promise<T> {
  const res = await fetch(`/profile-api${path}`, { method, headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function enableSkillForAgent(agentId: string, skillId: string): Promise<boolean> {
  const data = await mutateRequest<{ enabled: boolean }>(`/${agentId}/skills/${skillId}`, 'POST');
  return data.enabled;
}

export async function disableSkillForAgent(agentId: string, skillId: string): Promise<boolean> {
  const data = await mutateRequest<{ enabled: boolean }>(`/${agentId}/skills/${skillId}`, 'DELETE');
  return data.enabled;
}
