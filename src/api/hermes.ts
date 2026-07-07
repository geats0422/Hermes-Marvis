import type { HermesHealth, HermesHealthDetailed, HermesSession, HermesMessage, HermesSkill, HermesToolset } from '../types/hermes';

const API_BASE = '';
const API_KEY = import.meta.env.VITE_HERMES_API_KEY as string | undefined;

export function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) h.Authorization = `Bearer ${API_KEY}`;
  return h;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('VITE_HERMES_API_KEY is not configured');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...buildHeaders(), ...options.headers },
  });
  if (!res.ok) {
    let errMsg = `Hermes API ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) errMsg += `: ${typeof body.error === 'string' ? body.error : body.error.message || JSON.stringify(body.error)}`;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errMsg += `: ${text}`;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function checkHealth(): Promise<HermesHealth | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getHealthDetailed(): Promise<HermesHealthDetailed | null> {
  if (!API_KEY) return null;
  try {
    return await request<HermesHealthDetailed>('/health/detailed');
  } catch {
    return null;
  }
}

export async function getSessions(): Promise<HermesSession[]> {
  const data = await request<{ object: string; data: HermesSession[] }>('/api/sessions');
  return data.data || [];
}

export async function createSession(title?: string): Promise<HermesSession> {
  const data = await request<{ object: string; session: HermesSession }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ title: title || '新对话' }),
  });
  return data.session;
}

export async function getSessionMessages(sessionId: string): Promise<HermesMessage[]> {
  const data = await request<{ object: string; data: HermesMessage[] }>(`/api/sessions/${sessionId}/messages`);
  return data.data || [];
}

export async function deleteSession(sessionId: string): Promise<void> {
  await request(`/api/sessions/${sessionId}`, { method: 'DELETE' });
}

export interface ChatContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface SSEToolEvent {
  type: 'started' | 'completed' | 'failed';
  toolName: string;
  preview?: string;
}

export interface SSEReasoningDelta {
  toolName: string;
  delta: string;
}

export interface SSEEventHandlers {
  onChunk?: (text: string) => void;
  onReasoning?: (delta: string) => void;
  onToolEvent?: (event: SSEToolEvent) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
}

export async function sendChat(
  sessionId: string,
  message: string,
  onChunkOrHandlers?: ((text: string) => void) | SSEEventHandlers,
  onDoneLegacy?: () => void,
  attachments?: { name: string; dataUrl: string }[],
  signal?: AbortSignal,
): Promise<string> {
  const handlers: SSEEventHandlers = typeof onChunkOrHandlers === 'function'
    ? { onChunk: onChunkOrHandlers, onDone: onDoneLegacy }
    : (onChunkOrHandlers || {});

  let body: Record<string, unknown>;
  if (attachments && attachments.length > 0) {
    const content: ChatContentPart[] = [];
    if (message.trim()) {
      content.push({ type: 'text', text: message });
    }
    for (const att of attachments) {
      content.push({ type: 'image_url', image_url: { url: att.dataUrl } });
    }
    body = { message: content };
  } else {
    body = { message };
  }

  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/chat/stream`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let errMsg = `Chat failed: ${res.status}`;
    try {
      const errorBody = await res.json();
      if (errorBody.error) errMsg += `: ${typeof errorBody.error === 'string' ? errorBody.error : errorBody.error.message || ''}`;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errMsg += `: ${text}`;
    }
    throw new Error(errMsg);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        currentEvent = '';
        continue;
      }
      if (trimmed.startsWith('event:')) {
        currentEvent = trimmed.slice(6).trim();
        continue;
      }
      if (trimmed.startsWith(':')) {
        continue;
      }
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim();
        if (!data || !currentEvent) continue;

        try {
          const parsed = JSON.parse(data);

          switch (currentEvent) {
            case 'assistant.delta': {
              const delta = parsed.delta || '';
              if (delta) {
                fullText += delta;
                handlers.onChunk?.(fullText);
              }
              break;
            }
            case 'tool.progress': {
              const toolName = parsed.tool_name || '_thinking';
              const delta = parsed.delta || '';
              if (delta && toolName === '_thinking') {
                handlers.onReasoning?.(delta);
              }
              break;
            }
            case 'tool.started': {
              handlers.onToolEvent?.({
                type: 'started',
                toolName: parsed.tool_name || 'unknown',
                preview: parsed.preview,
              });
              break;
            }
            case 'tool.completed': {
              handlers.onToolEvent?.({
                type: 'completed',
                toolName: parsed.tool_name || 'unknown',
                preview: parsed.preview,
              });
              break;
            }
            case 'tool.failed': {
              handlers.onToolEvent?.({
                type: 'failed',
                toolName: parsed.tool_name || 'unknown',
                preview: parsed.preview,
              });
              break;
            }
            case 'error': {
              const msg = parsed.message || 'Unknown error';
              handlers.onError?.(msg);
              break;
            }
            case 'done': {
              break;
            }
          }
        } catch {
          // skip unparseable
        }
      }
    }
  }

  handlers.onDone?.();
  return fullText;
}

export async function getSkills(): Promise<HermesSkill[]> {
  const data = await request<{ object: string; data: HermesSkill[] }>('/v1/skills');
  return data.data || [];
}

export async function getToolsets(): Promise<HermesToolset[]> {
  const data = await request<{ object: string; data: HermesToolset[] }>('/v1/toolsets');
  return data.data || [];
}
