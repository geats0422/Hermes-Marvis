import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  X, Send, FileText, Plus, Image as ImageIcon, FileCode,
  Dna, Network, Activity, Brain, ScrollText, Settings, AlertCircle, RefreshCw
} from 'lucide-react';
import type { Agent, Memory } from '../data';
import type { ChatMessage } from '../types/hermes';
import type { AgentMemoryMap } from '../hooks/useAgentMemory';
import type { AgentProfileInfo, AgentSkill, AgentLogLine } from '../api/profile';

export type TabId = 'evolution' | 'skills' | 'runtime' | 'memory' | 'records' | 'config';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'evolution', label: '进化档案', icon: Dna },
  { id: 'skills', label: '技能图谱', icon: Network },
  { id: 'runtime', label: '运行时', icon: Activity },
  { id: 'memory', label: '记忆', icon: Brain },
  { id: 'records', label: '记录', icon: ScrollText },
  { id: 'config', label: '配置', icon: Settings },
];

interface AgentProfileTabsProps {
  agent: Agent;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  realTimeStatus: string;
  memories?: AgentMemoryMap;
  profileInfo?: AgentProfileInfo;
  skills: AgentSkill[];
  logs: AgentLogLine[];
  soul: string;
  config: string;
  env: string;
  globalMemory: string;
  globalUser: string;
  loading: Record<TabId, boolean>;
  errors: Record<TabId, string | null>;
  onRefresh: (tab: TabId) => void;
  messages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSend: () => void;
  attachments: { id: string; name: string; type: string; dataUrl?: string }[];
  fileError: string | null;
  isDragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  addFiles: (files: FileList) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  dropHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  openFilePicker: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function AgentProfileTabs(props: AgentProfileTabsProps) {
  const { activeTab, onTabChange } = props;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center px-4 py-2 gap-1 border-b overflow-x-auto" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap"
              style={{
                background: active ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: active ? '#00f0ff' : '#9ca3af',
                border: active ? '1px solid rgba(0,240,255,0.3)' : '1px solid transparent',
              }}
              whileHover={{ background: 'rgba(0,240,255,0.05)' }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon size={12} />
              <span>{t.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'evolution' && <EvolutionTab {...props} />}
        {activeTab === 'skills' && <SkillsTab {...props} />}
        {activeTab === 'runtime' && <RuntimeTab {...props} />}
        {activeTab === 'memory' && <MemoryTab {...props} />}
        {activeTab === 'records' && <RecordsTab {...props} />}
        {activeTab === 'config' && <ConfigTab {...props} />}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-full" style={{ color: '#666' }}>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00f0ff', borderTopColor: 'transparent' }} />
        <span>加载中…</span>
      </div>
    </div>
  );
}

function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-6">
      <div className="flex items-center gap-2 text-xs" style={{ color: '#ff2a6d' }}>
        <AlertCircle size={14} />
        <span>{msg}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(0,240,255,0.08)', color: '#00f0ff' }}>
          <RefreshCw size={10} /> 重试
        </button>
      )}
    </div>
  );
}

function EvolutionTab({ agent, loading, errors, onRefresh }: AgentProfileTabsProps) {
  if (loading.evolution) return <Loading />;
  if (errors.evolution) return <ErrorBox msg={errors.evolution} onRetry={() => onRefresh('evolution')} />;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Dna size={14} color="#00f0ff" />
        <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>{agent.name} · 进化档案</span>
      </div>
      <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
        进化档案记录该 Agent 的成长、版本升级与能力演进。当前数据由用户后续补充定义。
      </p>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: 'rgba(0,240,255,0.2)' }} />
        {[
          { time: '初始创建', title: 'Agent 初始化', desc: '基于 Hermes profile 完成首版配置' },
          { time: '待补充', title: '进化节点', desc: '等待用户定义进化档案数据结构' },
        ].map((item, idx) => (
          <div key={idx} className="relative mb-6">
            <div className="absolute -left-2.5 w-3 h-3 rounded-full" style={{ background: idx === 0 ? '#00f0ff' : '#666', boxShadow: idx === 0 ? '0 0 6px #00f0ff' : 'none' }} />
            <p className="text-[10px]" style={{ color: '#666' }}>{item.time}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#e0e0e0' }}>{item.title}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsTab({ agent, skills, loading, errors, onRefresh }: AgentProfileTabsProps) {
  if (loading.skills) return <Loading />;
  if (errors.skills) return <ErrorBox msg={errors.skills} onRetry={() => onRefresh('skills')} />;

  const displaySkills = skills.length > 0 ? skills : agent.skills.map((s) => ({ id: s.name, name: s.name, description: s.description }));

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network size={14} color="#ffd700" />
          <span className="text-xs font-bold" style={{ color: '#ffd700' }}>技能图谱</span>
        </div>
        <span className="text-[10px]" style={{ color: '#666' }}>共 {displaySkills.length} 个技能</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {displaySkills.map((skill, idx) => (
          <motion.div
            key={skill.id}
            className="rounded-lg px-3 py-3 border"
            style={{ borderColor: 'rgba(0,240,255,0.15)', background: 'rgba(0,240,255,0.03)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ borderColor: 'rgba(0,240,255,0.4)', boxShadow: '0 0 12px rgba(0,240,255,0.1)' }}
          >
            <p className="text-xs font-medium" style={{ color: '#e0e0e0' }}>{skill.name}</p>
            <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#9ca3af' }}>{skill.description || '暂无描述'}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RuntimeTab({ agent, realTimeStatus, logs, loading, errors, onRefresh }: AgentProfileTabsProps) {
  const statusColor = { online: '#00f0ff', busy: '#ffd700', slacking: '#39ff14', offline: '#666' }[realTimeStatus] || '#666';
  const statusLabel = { online: '在线', busy: '忙碌', slacking: '摸鱼', offline: '离线' }[realTimeStatus] || realTimeStatus;

  if (loading.runtime) return <Loading />;
  if (errors.runtime) return <ErrorBox msg={errors.runtime} onRetry={() => onRefresh('runtime')} />;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
          <span className="text-xs font-bold" style={{ color: '#e0e0e0' }}>{agent.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
            {statusLabel}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2 border" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[10px]" style={{ color: '#666' }}>职能</p>
            <p className="text-[11px]" style={{ color: '#e0e0e0' }}>{agent.title}</p>
          </div>
          <div className="rounded-lg p-2 border" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[10px]" style={{ color: '#666' }}>部门</p>
            <p className="text-[11px]" style={{ color: '#e0e0e0' }}>{agent.department}</p>
          </div>
          <div className="rounded-lg p-2 border" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[10px]" style={{ color: '#666' }}>最近更新</p>
            <p className="text-[11px]" style={{ color: '#e0e0e0' }}>实时</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} color="#00f0ff" />
          <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>运行日志</span>
        </div>
        {logs.length === 0 ? (
          <p className="text-[11px]" style={{ color: '#666' }}>暂无运行日志</p>
        ) : (
          <div className="space-y-1 font-mono">
            {logs.map((line, idx) => {
              const levelColor = line.level === 'ERROR' ? '#ff2a6d' : line.level === 'WARNING' ? '#ffd700' : '#00f0ff';
              return (
                <div key={idx} className="text-[10px] leading-relaxed border-b border-dashed py-1" style={{ borderColor: 'rgba(0,240,255,0.05)' }}>
                  <span style={{ color: '#666' }}>{line.time}</span>{' '}
                  <span style={{ color: levelColor }}>[{line.level}]</span>{' '}
                  <span style={{ color: '#e0e0e0' }}>{line.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryTab({ agent, memories, globalMemory, globalUser, loading, errors, onRefresh }: AgentProfileTabsProps) {
  const agentMemories: Memory[] = (agent && memories && memories[agent.id])
    ? memories[agent.id]
    : (agent?.memory || []);

  if (loading.memory) return <Loading />;
  if (errors.memory) return <ErrorBox msg={errors.memory} onRetry={() => onRefresh('memory')} />;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={14} color="#39ff14" />
        <span className="text-xs font-bold" style={{ color: '#39ff14' }}>记忆</span>
      </div>

      <div className="mb-5">
        <p className="text-[10px] mb-2" style={{ color: '#666' }}>Agent 记忆时间线</p>
        <div className="space-y-2">
          {agentMemories.map((mem, idx) => (
            <div key={idx} className="flex gap-3 relative">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full" style={{ background: mem.type === 'error' ? '#ff2a6d' : '#ffd700' }} />
                {idx < agentMemories.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,215,0,0.2)' }} />}
              </div>
              <div className="pb-3">
                <p className="text-[10px]" style={{ color: '#666' }}>{mem.timestamp}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#e0e0e0' }}>{mem.content}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ color: mem.type === 'error' ? '#ff2a6d' : mem.type === 'chat' ? '#00f0ff' : '#ffd700', background: `${mem.type === 'error' ? '#ff2a6d' : mem.type === 'chat' ? '#00f0ff' : '#ffd700'}11` }}>
                  {mem.type === 'task' ? '任务' : mem.type === 'chat' ? '对话' : '异常'}
                </span>
              </div>
            </div>
          ))}
          {agentMemories.length === 0 && <p className="text-[11px]" style={{ color: '#666' }}>暂无记忆</p>}
        </div>
      </div>

      {globalMemory && (
        <div className="mb-4 rounded-lg border p-3" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
          <p className="text-[10px] mb-2" style={{ color: '#00f0ff' }}>全局记忆 MEMORY.md</p>
          <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#9ca3af' }}>{globalMemory.slice(0, 800)}{globalMemory.length > 800 ? '…' : ''}</pre>
        </div>
      )}
      {globalUser && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
          <p className="text-[10px] mb-2" style={{ color: '#00f0ff' }}>用户画像 USER.md</p>
          <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#9ca3af' }}>{globalUser.slice(0, 800)}{globalUser.length > 800 ? '…' : ''}</pre>
        </div>
      )}
    </div>
  );
}

type RecordSubTab = 'chat' | 'logs' | 'tasks';

function RecordsTab(props: AgentProfileTabsProps) {
  const [subTab, setSubTab] = useState<RecordSubTab>('chat');
  const { agent, logs, messages, chatLoading, chatInput, setChatInput, handleSend, attachments, fileError, isDragOver, fileInputRef, addFiles, removeAttachment, handlePaste, dropHandlers, openFilePicker, messagesEndRef } = props;

  const taskMemories = (agent.memory || []).filter((m) => m.type === 'task');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 py-2 border-b" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
        {([
          { id: 'chat', label: '对话' },
          { id: 'logs', label: '日志' },
          { id: 'tasks', label: '任务' },
        ] as { id: RecordSubTab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className="px-2 py-1 rounded text-[10px]"
            style={{
              background: subTab === t.id ? 'rgba(0,240,255,0.1)' : 'transparent',
              color: subTab === t.id ? '#00f0ff' : '#666',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {subTab === 'chat' && (
          <div className="h-full flex flex-col px-4 py-3" {...dropHandlers}>
            <div className="flex-1 overflow-y-auto space-y-2 mb-2">
              {messages.map((msg) => (
                <div key={msg.id} className="text-[11px] px-2 py-1 rounded" style={{ background: msg.role === 'user' ? 'rgba(0,240,255,0.1)' : 'rgba(255,215,0,0.1)', color: '#e0e0e0', borderLeft: `2px solid ${msg.role === 'user' ? '#00f0ff' : '#ffd700'}` }}>
                  <span className="font-medium" style={{ color: msg.role === 'user' ? '#00f0ff' : '#ffd700' }}>{msg.role === 'user' ? '用户' : agent.name}:</span>{' '}
                  {msg.imageUrls && msg.imageUrls.length > 0 && (
                    <span>{msg.imageUrls.map((_, i) => `[图片${i + 1}]`).join(' ')}</span>
                  )}
                  {msg.text || (msg.streaming ? '思考中...' : '')}
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-[11px] text-center py-2" style={{ color: '#666' }}>输入消息与 {agent.name} 对话…</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border" style={{ background: 'rgba(0,240,255,0.06)', borderColor: 'rgba(0,240,255,0.15)' }}>
                    {att.type === 'image' && att.dataUrl ? (
                      <img src={att.dataUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                    ) : att.type === 'image' ? (
                      <ImageIcon size={8} color="#00f0ff" />
                    ) : att.type === 'text' ? (
                      <FileCode size={8} color="#00f0ff" />
                    ) : (
                      <FileText size={8} color="#00f0ff" />
                    )}
                    <span className="max-w-[80px] truncate" style={{ color: '#e0e0e0' }}>{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="p-0.5 rounded hover:bg-white/10">
                      <X size={7} color="#9ca3af" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileError && (
              <div className="mb-1">
                <span className="text-[9px]" style={{ color: '#ff2a6d' }}>{fileError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files!)} />
              <motion.button
                className="px-2 py-2 rounded border flex-shrink-0"
                style={{ borderColor: 'rgba(0,240,255,0.2)', background: 'rgba(0,240,255,0.05)', color: '#00f0ff' }}
                whileHover={{ background: 'rgba(0,240,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={openFilePicker}
              >
                <Plus size={14} />
              </motion.button>
              <textarea
                className="flex-1 rounded border px-3 py-2 text-xs outline-none resize-none"
                style={{ background: 'rgba(0,0,0,0.5)', borderColor: isDragOver ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.3)', color: '#e0e0e0', minHeight: 32, maxHeight: 100 }}
                placeholder="输入指令… (Shift+Enter 换行, 可粘贴图片)"
                rows={1}
                value={chatInput}
                onChange={(e) => { setChatInput(e.target.value); e.target.style.height = '32px'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                onPaste={handlePaste}
                disabled={chatLoading}
              />
              <motion.button
                className="px-3 py-2 rounded border text-xs font-bold"
                style={{
                  borderColor: '#ffd700',
                  background: (chatInput.trim() || attachments.length > 0) ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.05)',
                  color: (chatInput.trim() || attachments.length > 0) ? '#ffd700' : '#666',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(255,215,0,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={chatLoading || (!chatInput.trim() && attachments.length === 0)}
              >
                <Send size={14} />
              </motion.button>
            </div>
          </div>
        )}

        {subTab === 'logs' && (
          <div className="h-full overflow-y-auto px-4 py-3">
            {logs.length === 0 ? (
              <p className="text-[11px]" style={{ color: '#666' }}>暂无日志</p>
            ) : (
              <div className="space-y-1 font-mono">
                {logs.map((line, idx) => {
                  const levelColor = line.level === 'ERROR' ? '#ff2a6d' : line.level === 'WARNING' ? '#ffd700' : '#00f0ff';
                  return (
                    <div key={idx} className="text-[10px] leading-relaxed border-b border-dashed py-1" style={{ borderColor: 'rgba(0,240,255,0.05)' }}>
                      <span style={{ color: '#666' }}>{line.time}</span>{' '}
                      <span style={{ color: levelColor }}>[{line.level}]</span>{' '}
                      <span style={{ color: '#e0e0e0' }}>{line.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {subTab === 'tasks' && (
          <div className="h-full overflow-y-auto px-4 py-3">
            {taskMemories.length === 0 ? (
              <p className="text-[11px]" style={{ color: '#666' }}>暂无任务记录</p>
            ) : (
              <div className="space-y-2">
                {taskMemories.map((task, idx) => (
                  <div key={idx} className="rounded-lg border p-3" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
                    <p className="text-[10px]" style={{ color: '#666' }}>{task.timestamp}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#e0e0e0' }}>{task.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigTab({ soul, config, env, loading, errors, onRefresh }: AgentProfileTabsProps) {
  const [file, setFile] = useState<'soul' | 'config' | 'env'>('soul');
  const content = file === 'soul' ? soul : file === 'config' ? config : env;
  const error = errors.config;

  if (loading.config) return <Loading />;
  if (error) return <ErrorBox msg={error} onRetry={() => onRefresh('config')} />;

  const options: { id: 'soul' | 'config' | 'env'; label: string }[] = [
    { id: 'soul', label: 'SOUL.md' },
    { id: 'config', label: 'config.yaml' },
    { id: 'env', label: '.env' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 py-2 border-b" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setFile(o.id)}
            className="px-2 py-1 rounded text-[10px]"
            style={{
              background: file === o.id ? 'rgba(0,240,255,0.1)' : 'transparent',
              color: file === o.id ? '#00f0ff' : '#666',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {file === 'soul' ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content || '> 暂无内容'}</ReactMarkdown>
          </div>
        ) : (
          <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#e0e0e0' }}>{content || '暂无内容'}</pre>
        )}
      </div>
    </div>
  );
}
