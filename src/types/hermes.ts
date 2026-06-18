export interface HermesHealth {
  status: 'ok';
  platform: string;
}

export interface HermesSession {
  id: string;
  title: string | null;
  source: string;
  message_count: number;
  tool_call_count: number;
  started_at: number;
  last_active: number;
  ended_at: number | null;
  preview: string;
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
