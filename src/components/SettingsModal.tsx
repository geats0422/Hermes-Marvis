import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings, Brain, Bot, Shield,
  Moon, Languages, Key,
  Cpu, Eye, Zap, RefreshCw, HardDrive, Lock,
  Activity, Globe, ChevronRight, Sparkles,
  Server, Bell, Volume2, Heart, ShieldAlert,
  Loader2, AlertTriangle,
} from 'lucide-react';
import type {
  SettingsOverview,
  MarvisSettings,
  HermesModelConfig,
  HermesDisplayConfig,
  HermesTtsConfig,
  HermesDelegationConfig,
  HermesMemoryConfig,
  HermesDashboardConfig,
  GatewayStatus,
  McpServersMap,
} from '../types/settings';
import {
  getSettingsOverview,
  updateConfigFields,
  updateMarvisSettings,
  addMcpServer,
  deleteMcpServer,
} from '../api/settings';
import ProviderModal from './ProviderModal';

type SettingsSection = 'ai' | 'general' | 'agent' | 'system';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'ai', label: 'AI 模式', icon: Brain },
  { id: 'general', label: '通用设置', icon: Settings },
  { id: 'agent', label: 'Agent 配置', icon: Bot },
  { id: 'system', label: '系统', icon: Shield },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('ai');
  const [overview, setOverview] = useState<SettingsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettingsOverview();
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadSettings();
  }, [isOpen, loadSettings]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const saveConfig = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      await updateConfigFields(updates);
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveMarvis = async (updates: Partial<MarvisSettings>) => {
    setSaving(true);
    try {
      await updateMarvisSettings(updates);
      await loadSettings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const cfg = overview?.config || {};
  const marvis = overview?.marvis || {} as MarvisSettings;
  const model = (cfg.model || {}) as HermesModelConfig;
  const display = (cfg.display || {}) as HermesDisplayConfig;
  const tts = (cfg.tts || {}) as HermesTtsConfig;
  const delegation = (cfg.delegation || {}) as HermesDelegationConfig;
  const memory = (cfg.memory || {}) as HermesMemoryConfig;
  const dashboard = (cfg.dashboard || {}) as HermesDashboardConfig;
  const gateway = overview?.gateway || {} as GatewayStatus;
  const mcpServers = overview?.mcp_servers || {} as McpServersMap;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="flex rounded-2xl overflow-hidden"
            style={{
              width: 'min(820px, 90vw)',
              height: 'min(600px, 80vh)',
              background: 'rgba(10, 10, 15, 0.96)',
              border: '1px solid rgba(0,240,255,0.2)',
              boxShadow: '0 0 60px rgba(0,240,255,0.1), 0 0 100px rgba(0,0,0,0.5)',
            }}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-52 flex-shrink-0 flex flex-col border-r" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(0,0,0,0.4)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <h2 className="text-sm font-bold tracking-wider" style={{ color: '#e0e0e0' }}>设置</h2>
              </div>
              <nav className="flex-1 overflow-y-auto py-2">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="relative w-full flex items-center gap-2.5 px-5 py-2.5 text-[12px] transition-colors text-left"
                      style={{ background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent', color: isActive ? '#00f0ff' : '#9ca3af' }}
                      onClick={() => setActiveSection(item.id)}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#e0e0e0'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                          style={{ background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }}
                          layoutId="settings-nav-indicator"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <p className="text-[9px]" style={{ color: '#666' }}>Hermes Marvis</p>
                <p className="text-[9px]" style={{ color: '#444' }}>v1.0.0</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <h3 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                  {navItems.find((i) => i.id === activeSection)?.label}
                </h3>
                <div className="flex items-center gap-2">
                  {saving && <Loader2 size={12} className="animate-spin" color="#00f0ff" />}
                  <motion.button
                    className="flex items-center justify-center w-7 h-7 rounded"
                    style={{ background: 'rgba(0,240,255,0.05)' }}
                    whileHover={{ background: 'rgba(0,240,255,0.15)', rotate: 90 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    title="关闭"
                  >
                    <X size={14} color="#9ca3af" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading && !overview ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin" color="#00f0ff" />
                  </div>
                ) : error && !overview ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <AlertTriangle size={20} color="#ff2a6d" />
                    <p className="text-[11px]" style={{ color: '#ff2a6d' }}>{error}</p>
                    <button className="text-[10px] px-3 py-1 rounded" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }} onClick={loadSettings}>重试</button>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                      {activeSection === 'ai' && <AISection model={model} providers={overview?.providers || { configured: [], available: [] }} onOpenProviders={() => setShowProviderModal(true)} />}
                      {activeSection === 'general' && <GeneralSection display={display} tts={tts} marvis={marvis} skinOptions={overview?.skin_options || []} ttsProviders={overview?.tts_providers || []} ttsVoices={overview?.tts_voices || {}} onSaveConfig={saveConfig} onSaveMarvis={saveMarvis} />}
                      {activeSection === 'agent' && <AgentSection delegation={delegation} memory={memory} marvis={marvis} onSaveConfig={saveConfig} onSaveMarvis={saveMarvis} />}
                      {activeSection === 'system' && <SystemSection dashboard={dashboard} gateway={gateway} mcpServers={mcpServers} onSaveConfig={saveConfig} onSaveMarvis={saveMarvis} onRefresh={loadSettings} />}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>

          <ProviderModal
            isOpen={showProviderModal}
            onClose={() => setShowProviderModal(false)}
            providers={overview?.providers?.available || []}
            onRefresh={loadSettings}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AISection({ model, providers, onOpenProviders }: {
  model: HermesModelConfig;
  providers: { configured: { id: string; name: string }[]; available: { id: string; name: string }[] };
  onOpenProviders: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg p-3 border" style={{ borderColor: 'rgba(255,215,0,0.2)', background: 'rgba(255,215,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={12} color="#ffd700" />
          <span className="text-[11px] font-bold" style={{ color: '#ffd700' }}>核心配置</span>
        </div>
        <p className="text-[10px]" style={{ color: '#9ca3af' }}>AI 模型配置影响所有 Agent 的回复质量与成本，请谨慎调整。</p>
      </div>

      <SettingRow icon={Brain} label="调度模型" desc={`当前: ${model.default || '未设置'} (${model.provider || 'default'})`}>
        <span className="text-[10px] font-mono" style={{ color: '#00f0ff' }}>{model.default || '—'}</span>
      </SettingRow>

      <SettingRow icon={Key} label="已连接 Provider" desc={`${providers.configured.length} 个已配置`}>
        <div className="flex items-center gap-1 flex-wrap">
          {providers.configured.map((p) => (
            <span key={p.id} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(57,255,20,0.1)', color: '#39ff14' }}>
              {p.name}
            </span>
          ))}
        </div>
      </SettingRow>

      <motion.button
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px]"
        style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
        whileHover={{ background: 'rgba(0,240,255,0.15)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenProviders}
      >
        配置 Provider
        <ChevronRight size={12} />
      </motion.button>
    </div>
  );
}

function GeneralSection({ display, tts, marvis, skinOptions, ttsProviders, ttsVoices, onSaveConfig, onSaveMarvis }: {
  display: HermesDisplayConfig;
  tts: HermesTtsConfig;
  marvis: MarvisSettings;
  skinOptions: string[];
  ttsProviders: string[];
  ttsVoices: Record<string, string[]>;
  onSaveConfig: (u: Record<string, unknown>) => Promise<void>;
  onSaveMarvis: (u: Partial<MarvisSettings>) => Promise<void>;
}) {
  const currentSkin = display.skin || 'default';
  const currentLang = display.language || 'en';
  const currentTtsProvider = tts.provider || 'edge';
  const currentTtsVoice = (tts as Record<string, Record<string, string>>)[currentTtsProvider]?.voice || '';

  return (
    <div className="space-y-3">
      <SectionLabel label="外观" />
      <SettingRow icon={Moon} label="主题 (Skin)" desc={`当前: ${currentSkin}`}>
        <select
          className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          value={currentSkin}
          onChange={(e) => onSaveConfig({ 'display.skin': e.target.value })}
        >
          {skinOptions.map((s) => <option key={s} value={s} style={{ background: '#0a0a0f' }}>{s}</option>)}
        </select>
      </SettingRow>
      <SettingRow icon={Languages} label="语言" desc={`当前: ${currentLang}`}>
        <select
          className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          value={currentLang}
          onChange={(e) => onSaveConfig({ 'display.language': e.target.value })}
        >
          <option value="zh" style={{ background: '#0a0a0f' }}>简体中文</option>
          <option value="en" style={{ background: '#0a0a0f' }}>English</option>
          <option value="ja" style={{ background: '#0a0a0f' }}>日本語</option>
        </select>
      </SettingRow>

      <SectionLabel label="语音" />
      <SettingRow icon={Volume2} label="TTS 引擎" desc={`当前: ${currentTtsProvider}`}>
        <select
          className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          value={currentTtsProvider}
          onChange={(e) => onSaveConfig({ 'tts.provider': e.target.value })}
        >
          {ttsProviders.map((p) => <option key={p} value={p} style={{ background: '#0a0a0f' }}>{p}</option>)}
        </select>
      </SettingRow>
      {(ttsVoices[currentTtsProvider] || []).length > 0 && (
        <SettingRow icon={Activity} label="TTS Voice" desc="语音合成声音">
          <select
            className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
            value={currentTtsVoice}
            onChange={(e) => onSaveConfig({ [`tts.${currentTtsProvider}.voice`]: e.target.value })}
          >
            {(ttsVoices[currentTtsProvider] || []).map((v) => <option key={v} value={v} style={{ background: '#0a0a0f' }}>{v}</option>)}
          </select>
        </SettingRow>
      )}

      <SectionLabel label="显示偏好" />
      <ToggleRow icon={Eye} label="显示 Token 用量" desc="show_cost" checked={!!display.show_cost} onChange={(v) => onSaveConfig({ 'display.show_cost': v })} />
      <ToggleRow icon={Bell} label="浏览器通知" desc="notifications_enabled" checked={!!marvis.notifications_enabled} onChange={(v) => onSaveMarvis({ notifications_enabled: v })} />
      <ToggleRow icon={Cpu} label="显示供应商配额标签" desc="show_quota_chip" checked={!!marvis.show_quota_chip} onChange={(v) => onSaveMarvis({ show_quota_chip: v })} />
      <ToggleRow icon={Activity} label="显示会话大纲" desc="show_conversation_outline" checked={!!marvis.show_conversation_outline} onChange={(v) => onSaveMarvis({ show_conversation_outline: v })} />
      <ToggleRow icon={Zap} label="显示 Token 速度 (TPS)" desc="show_tps" checked={!!marvis.show_tps} onChange={(v) => onSaveMarvis({ show_tps: v })} />
      <ToggleRow icon={Sparkles} label="淡入文字效果" desc="fade_text_effect" checked={!!marvis.fade_text_effect} onChange={(v) => onSaveMarvis({ fade_text_effect: v })} />
      <ToggleRow icon={RefreshCw} label="输出时自动展开终端" desc="terminal_auto_expand_on_output" checked={!!marvis.terminal_auto_expand_on_output} onChange={(v) => onSaveMarvis({ terminal_auto_expand_on_output: v })} />
      <ToggleRow icon={Lock} label="在 API 响应中隐藏敏感数据" desc="api_redact_enabled" checked={marvis.api_redact_enabled !== false} onChange={(v) => onSaveMarvis({ api_redact_enabled: v })} />
    </div>
  );
}

function AgentSection({ delegation, memory, marvis, onSaveConfig, onSaveMarvis }: {
  delegation: HermesDelegationConfig;
  memory: HermesMemoryConfig;
  marvis: MarvisSettings;
  onSaveConfig: (u: Record<string, unknown>) => Promise<void>;
  onSaveMarvis: (u: Partial<MarvisSettings>) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <SettingRow icon={Zap} label="最大并发 Subagent" desc={`首辅可同时调动 (当前: ${delegation.max_concurrent_children ?? 3})`}>
        <select
          className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          value={String(delegation.max_concurrent_children ?? 3)}
          onChange={(e) => onSaveConfig({ 'delegation.max_concurrent_children': parseInt(e.target.value) })}
        >
          {['1', '2', '3', '4', '5', '8', '10'].map((n) => <option key={n} value={n} style={{ background: '#0a0a0f' }}>{n}</option>)}
        </select>
      </SettingRow>

      <SectionLabel label="容错与恢复" />
      <SettingRow icon={ShieldAlert} label="熔断阈值" desc={`连续失败 ${marvis.circuit_breaker_threshold ?? 3} 次后自动隔离`}>
        <select
          className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          value={String(marvis.circuit_breaker_threshold ?? 3)}
          onChange={(e) => onSaveMarvis({ circuit_breaker_threshold: parseInt(e.target.value) })}
        >
          {['3', '5', '10', '15'].map((n) => <option key={n} value={n} style={{ background: '#0a0a0f' }}>{n} 次</option>)}
        </select>
      </SettingRow>
      <SettingRow icon={Heart} label="心跳间隔" desc="健康检查频率">
        <select
          className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          value={String(marvis.heartbeat_interval_seconds ?? 30)}
          onChange={(e) => onSaveMarvis({ heartbeat_interval_seconds: parseInt(e.target.value) })}
        >
          {['15', '30', '60', '120'].map((n) => <option key={n} value={n} style={{ background: '#0a0a0f' }}>{n}s</option>)}
        </select>
      </SettingRow>
      <ToggleRow icon={RefreshCw} label="自动恢复" desc="故障 Agent 自动重启" checked={!!marvis.auto_recovery_enabled} onChange={(v) => onSaveMarvis({ auto_recovery_enabled: v })} />

      <SectionLabel label="记忆" />
      <ToggleRow icon={HardDrive} label="记忆持久化" desc="会话记忆自动保存" checked={!!memory.memory_enabled} onChange={(v) => onSaveConfig({ 'memory.memory_enabled': v })} />
    </div>
  );
}

function SystemSection({ dashboard, gateway, mcpServers, onSaveConfig, onSaveMarvis, onRefresh }: {
  dashboard: HermesDashboardConfig;
  gateway: GatewayStatus;
  mcpServers: McpServersMap;
  onSaveConfig: (u: Record<string, unknown>) => Promise<void>;
  onSaveMarvis: (u: Partial<MarvisSettings>) => Promise<void>;
  onRefresh: () => void;
}) {
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpCommand, setNewMcpCommand] = useState('');
  const mcpEntries = Object.entries(mcpServers);

  return (
    <div className="space-y-3">
      <SectionLabel label="访问密码" />
      <div>
        <label className="text-[10px] block mb-1" style={{ color: '#9ca3af' }}>输入新密码以设置或更改。留空保持当前设置。</label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="新密码..."
            className="flex-1 px-3 py-2 rounded-lg text-[11px] outline-none"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#e0e0e0' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                  const hash = btoa(target.value);
                  onSaveMarvis({ access_password_hash: hash });
                  target.value = '';
                }
              }
            }}
          />
        </div>
      </div>

      <SectionLabel label="官方 Hermes 仪表盘" />
      <SettingRow icon={Globe} label="仪表盘 URL" desc="公开反向代理 URL">
        <input
          type="text"
          defaultValue={dashboard.public_url || ''}
          placeholder="https://hermes.example.com"
          className="w-40 px-2 py-1 rounded text-[10px] outline-none"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
          onBlur={(e) => { if (e.target.value !== (dashboard.public_url || '')) onSaveConfig({ 'dashboard.public_url': e.target.value }); }}
        />
      </SettingRow>

      <SectionLabel label="网关状态" />
      <div className="rounded-lg p-3 border" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full`} style={{ background: gateway.running ? '#39ff14' : '#666', boxShadow: gateway.running ? '0 0 4px #39ff14' : 'none' }} />
          <span className="text-[11px] font-bold" style={{ color: gateway.running ? '#39ff14' : '#666' }}>
            {gateway.running ? '网关运行中' : '网关未运行'}
          </span>
        </div>
        {gateway.platforms && Object.entries(gateway.platforms).map(([name, plat]) => {
          const p = plat as unknown as Record<string, boolean>;
          return (
            <div key={name} className="flex items-center gap-2 py-1 text-[10px]" style={{ color: '#9ca3af' }}>
              <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: p.connected ? '#39ff14' : '#444' }} />
              <span>{name}</span>
              <span className="ml-auto" style={{ color: p.connected ? '#39ff14' : '#666' }}>
                {p.connected ? '已连接' : '未连接'}
              </span>
            </div>
          );
        })}
      </div>

      <SectionLabel label="MCP 服务器" />
      <div className="space-y-2">
        {mcpEntries.map(([name, config]) => (
          <div key={name} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.08)' }}>
            <Server size={12} color="#00f0ff" />
            <span className="text-[11px] flex-1" style={{ color: '#e0e0e0' }}>{name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: config.enabled !== false ? 'rgba(57,255,20,0.1)' : 'rgba(255,42,109,0.1)', color: config.enabled !== false ? '#39ff14' : '#ff2a6d' }}>
              {config.enabled !== false ? 'ON' : 'OFF'}
            </span>
            <button
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,42,109,0.1)', color: '#ff2a6d' }}
              onClick={async () => { await deleteMcpServer(name); onRefresh(); }}
            >
              删除
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newMcpName}
            onChange={(e) => setNewMcpName(e.target.value)}
            placeholder="名称"
            className="w-24 px-2 py-1.5 rounded text-[10px] outline-none"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#e0e0e0' }}
          />
          <input
            type="text"
            value={newMcpCommand}
            onChange={(e) => setNewMcpCommand(e.target.value)}
            placeholder="command (如 npx @modelcontextprotocol/server-filesystem)"
            className="flex-1 px-2 py-1.5 rounded text-[10px] outline-none"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.2)', color: '#e0e0e0' }}
          />
          <button
            className="px-3 py-1.5 rounded text-[10px]"
            style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
            onClick={async () => {
              if (newMcpName && newMcpCommand) {
                await addMcpServer(newMcpName, { command: newMcpCommand, enabled: true });
                setNewMcpName('');
                setNewMcpCommand('');
                onRefresh();
              }
            }}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="pt-2 pb-1">
      <span className="text-[10px] font-bold tracking-wider" style={{ color: '#00f0ff' }}>{label}</span>
      <div className="mt-1 h-px" style={{ background: 'rgba(0,240,255,0.08)' }} />
    </div>
  );
}

function SettingRow({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.08)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,240,255,0.08)' }}>
        <Icon size={14} color="#00f0ff" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium" style={{ color: '#e0e0e0' }}>{label}</p>
        <p className="text-[10px]" style={{ color: '#666' }}>{desc}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({ icon, label, desc, checked, onChange }: { icon: React.ElementType; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <SettingRow icon={icon} label={label} desc={desc}>
      <button
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{
          background: checked ? 'rgba(0,240,255,0.3)' : 'rgba(0,0,0,0.5)',
          border: `1px solid ${checked ? '#00f0ff' : 'rgba(255,255,255,0.1)'}`,
        }}
        onClick={() => onChange(!checked)}
      >
        <motion.div
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
          style={{ background: checked ? '#00f0ff' : '#666', boxShadow: checked ? '0 0 6px #00f0ff' : 'none' }}
          animate={{ left: checked ? '18px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </SettingRow>
  );
}
