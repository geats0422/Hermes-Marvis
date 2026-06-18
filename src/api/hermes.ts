import type { HermesHealth, HermesSession, HermesMessage, HermesSkill, HermesToolset } from '../types/hermes';

const API_BASE = '';
const API_KEY = import.meta.env.VITE_HERMES_API_KEY as string | undefined;

function buildHeaders(): Record<string, string> {
 const h: Record<string, string> = { 'Content-Type': 'application/json' };
 if (API_KEY) h.Authorization = `Bearer ${API_KEY}`;
 return h;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
 if (!API_KEY) {
 throw new Error('VITE_HERMES_API_KEY is not configured');
 }
 const res = await fetch(`${API_BASE}${path}`, {
 ...options,
 headers: { ...buildHeaders(), ...options.headers },
 });
 if (!res.ok) {
 const text = await res.text().catch(() => '');
 throw new Error(`Hermes API ${res.status}: ${text || res.statusText}`);
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

export async function sendChat(
  sessionId: string,
  message: string,
  onChunk?: (text: string) => void,
  onDone?: () => void,
  attachments?: { name: string; dataUrl: string }[],
  signal?: AbortSignal,
): Promise<string> {
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
    const text = await res.text().catch(() => '');
    throw new Error(`Chat failed: ${res.status} ${text}`);
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
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim();
        if (currentEvent === 'assistant.delta') {
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.delta || '';
            if (delta) {
              fullText += delta;
              onChunk?.(fullText);
            }
          } catch {
            // skip
          }
        }
      }
    }
  }

  onDone?.();
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
