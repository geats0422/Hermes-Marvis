export interface HermesHealth {
  status: 'ok';
  platform: string;
}

export interface HermesHealthDetailed {
  status: 'ok';
  platform: string;
  version: string;
  gateway_state: string;
  platforms: Record<string, unknown>;
  active_agents: number;
  gateway_busy: boolean;
  gateway_drainable: boolean;
  exit_reason: string | null;
  updated_at: number | null;
  pid: number;
}

export interface HermesSession {
  id: string;
  title: string | null;
  source: string;
  model: string | null;
  message_count: number;
  tool_call_count: number;
  api_call_count: number;
  started_at: number;
  last_active: number;
  ended_at: number | null;
  preview: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  reasoning_tokens: number;
  estimated_cost_usd: number | null;
  actual_cost_usd: number | null;
  parent_session_id: string | null;
}

export interface HermesMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  session_id: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  streaming?: boolean;
  imageUrls?: string[];
  reasoning?: string;
  toolEvents?: { type: 'started' | 'completed' | 'failed'; toolName: string; preview?: string }[];
}

export interface AgentChatContext {
  agentId: string;
  agentName: string;
  sessionId?: string;
  isMainAgent: boolean;
}

export interface HermesSkill {
  name: string;
  description: string;
  category: string | null;
}

export interface HermesToolset {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  tools: string[];
}
