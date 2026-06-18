import type {
  SettingsOverview,
  MarvisSettings,
  ProvidersStatus,
  GatewayStatus,
  McpServerConfig,
  McpServersMap,
} from '../types/settings';

const CRON_API_KEY = import.meta.env.VITE_CRON_API_KEY as string | undefined;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CRON_API_KEY) headers['Authorization'] = `Bearer ${CRON_API_KEY}`;
  const res = await fetch(`/cron-api/settings${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Settings API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getSettingsOverview(): Promise<SettingsOverview> {
  return request<SettingsOverview>('');
}

export async function getHermesConfig(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>('/config');
}

export async function updateConfigFields(updates: Record<string, unknown>): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/config', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
}

export async function updateConfigField(path: string, value: unknown): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/config', {
    method: 'PUT',
    body: JSON.stringify({ path, value }),
  });
}

export async function getMarvisSettings(): Promise<MarvisSettings> {
  return request<MarvisSettings>('/marvis');
}

export async function updateMarvisSettings(settings: Partial<MarvisSettings>): Promise<{ ok: boolean; settings: MarvisSettings }> {
  return request<{ ok: boolean; settings: MarvisSettings }>('/marvis', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function getProviders(): Promise<ProvidersStatus> {
  return request<ProvidersStatus>('/providers');
}

export async function connectProvider(provider: string, apiKey: string, baseUrl?: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/providers/connect', {
    method: 'POST',
    body: JSON.stringify({ provider, api_key: apiKey, base_url: baseUrl || undefined }),
  });
}

export async function testProvider(provider: string, apiKey: string, baseUrl?: string): Promise<{ ok: boolean; reachable: boolean; message: string }> {
  return request<{ ok: boolean; reachable: boolean; message: string }>('/providers/test', {
    method: 'POST',
    body: JSON.stringify({ provider, api_key: apiKey, base_url: baseUrl || undefined }),
  });
}

export async function disconnectProvider(providerId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/providers/${providerId}`, {
    method: 'DELETE',
  });
}

export async function getGatewayStatus(): Promise<GatewayStatus> {
  return request<GatewayStatus>('/gateway');
}

export async function getMcpServers(): Promise<McpServersMap> {
  return request<McpServersMap>('/mcp');
}

export async function addMcpServer(name: string, config: McpServerConfig): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/mcp', {
    method: 'POST',
    body: JSON.stringify({ name, ...config }),
  });
}

export async function updateMcpServer(name: string, config: Partial<McpServerConfig>): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/mcp/${name}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function deleteMcpServer(name: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/mcp/${name}`, {
    method: 'DELETE',
  });
}
