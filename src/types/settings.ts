export interface MarvisSettings {
  theme: string;
  language: string;
  notifications_enabled: boolean;
  show_quota_chip: boolean;
  show_conversation_outline: boolean;
  show_tps: boolean;
  fade_text_effect: boolean;
  terminal_auto_expand_on_output: boolean;
  api_redact_enabled: boolean;
  access_password_hash: string | null;
  auto_recovery_enabled: boolean;
  circuit_breaker_threshold: number;
  heartbeat_interval_seconds: number;
}

export interface ProviderEntry {
  id: string;
  name: string;
  key_env: string;
  base_url_env: string | null;
  docs_url: string | null;
  configured: boolean;
  redacted_key: string | null;
  base_url: string | null;
}

export interface ProvidersStatus {
  configured: ProviderEntry[];
  available: ProviderEntry[];
}

export interface GatewayPlatform {
  platform: string;
  connected: boolean;
  configured: boolean;
}

export interface GatewayStatus {
  running: boolean;
  platforms?: Record<string, GatewayPlatform>;
  error?: string;
}

export interface McpServerConfig {
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
}

export type McpServersMap = Record<string, McpServerConfig>;

export interface SettingsOverview {
  config: Record<string, unknown>;
  marvis: MarvisSettings;
  providers: ProvidersStatus;
  gateway: GatewayStatus;
  mcp_servers: McpServersMap;
  skin_options: string[];
  tts_providers: string[];
  tts_voices: Record<string, string[]>;
}

export interface HermesModelConfig {
  default?: string;
  provider?: string;
  base_url?: string;
}

export interface HermesDisplayConfig {
  skin?: string;
  language?: string;
  show_cost?: boolean;
  show_reasoning?: boolean;
  streaming?: boolean;
  tool_progress?: string;
}

export interface HermesTtsConfig {
  provider?: string;
  edge?: { voice?: string };
  openai?: { voice?: string; model?: string };
  elevenlabs?: { voice_id?: string; model_id?: string };
  xai?: { voice_id?: string; language?: string };
  mistral?: { model?: string; voice_id?: string };
}

export interface HermesSecurityConfig {
  redact_secrets?: boolean;
  redact_pii?: boolean;
}

export interface HermesDelegationConfig {
  max_concurrent_children?: number;
  max_iterations?: number;
  max_spawn_depth?: number;
  child_timeout_seconds?: number;
}

export interface HermesMemoryConfig {
  memory_enabled?: boolean;
  user_profile_enabled?: boolean;
}

export interface HermesDashboardConfig {
  public_url?: string;
  theme?: string;
}
