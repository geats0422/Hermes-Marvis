import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Agent } from '../data';
import type { AgentMemoryMap } from '../hooks/useAgentMemory';
import type { AgentProfileInfo, AgentSkill, AgentLogLine } from '../api/profile';
import { useChat } from '../hooks/useHermes';
import { useAttachments } from '../hooks/useAttachments';
import { useAgentStatus } from '../hooks/useAgentStatus';
import {
  getAgentProfileInfo, getAgentSkills, getAgentLogs,
  getAgentSoul, getAgentConfig, getAgentEnv, getGlobalMemory,
} from '../api/profile';
import AgentProfileTabs, { type TabId } from './AgentProfileTabs';

interface ScrollDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  memories?: AgentMemoryMap;
}

export default function ScrollDetailModal({ agent, isOpen, onClose, memories }: ScrollDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('skills');
  const [chatInput, setChatInput] = useState('');

  const [profileInfo, setProfileInfo] = useState<AgentProfileInfo>();
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [logs, setLogs] = useState<AgentLogLine[]>([]);
  const [soul, setSoul] = useState('');
  const [config, setConfig] = useState('');
  const [env, setEnv] = useState('');
  const [globalMemory, setGlobalMemory] = useState('');
  const [globalUser, setGlobalUser] = useState('');

  const [loading, setLoading] = useState<Record<TabId, boolean>>({
    evolution: false, skills: false, runtime: false, memory: false, records: false, config: false,
  });
  const [errors, setErrors] = useState<Record<TabId, string | null>>({
    evolution: null, skills: null, runtime: null, memory: null, records: null, config: null,
  });

  const { statuses } = useAgentStatus(agent ? [agent] : []);
  const realTimeStatus = statuses.find((s) => s.id === agent?.id)?.status || agent?.status || 'online';

  const chatCtx = agent ? { agentId: agent.id, agentName: agent.name, isMainAgent: agent.department === '首辅' } : null;
  const { messages, send, loading: chatLoading } = useChat(chatCtx || { agentId: '', agentName: '', isMainAgent: true });

  const {
    attachments, fileError, isDragOver, fileInputRef,
    addFiles, removeAttachment, clearAttachments,
    handlePaste, dropHandlers, composeMessage, openFilePicker,
  } = useAttachments();

  const fetchTab = useCallback(async (tab: TabId, agentId: string) => {
    if (!agentId || tab === 'records' || tab === 'evolution') return;
    setLoading((prev) => ({ ...prev, [tab]: true }));
    setErrors((prev) => ({ ...prev, [tab]: null }));
    try {
      if (tab === 'skills') {
        const info = await getAgentProfileInfo(agentId);
        setProfileInfo(info);
        const s = await getAgentSkills(agentId);
        setSkills(s);
      } else if (tab === 'runtime') {
        const l = await getAgentLogs(agentId, 80);
        setLogs(l);
      } else if (tab === 'memory') {
        try { const m = await getGlobalMemory('MEMORY.md'); setGlobalMemory(m.content); } catch { /* ok */ }
        try { const u = await getGlobalMemory('USER.md'); setGlobalUser(u.content); } catch { /* ok */ }
      } else if (tab === 'config') {
        try { const s = await getAgentSoul(agentId); setSoul(s.content); } catch { setSoul(''); }
        try { const c = await getAgentConfig(agentId); setConfig(c.content); } catch { setConfig(''); }
        try { const e = await getAgentEnv(agentId); setEnv(e.content); } catch { setEnv(''); }
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, [tab]: err instanceof Error ? err.message : '加载失败' }));
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, []);

  useEffect(() => {
    if (isOpen && agent) {
      setSkills([]); setLogs([]); setSoul(''); setConfig(''); setEnv('');
      setGlobalMemory(''); setGlobalUser(''); setProfileInfo(undefined);
      setActiveTab('skills');
      fetchTab('skills', agent.id);
    }
  }, [isOpen, agent, fetchTab]);

  useEffect(() => {
    if (isOpen && agent) {
      fetchTab(activeTab, agent.id);
    }
  }, [activeTab, isOpen, agent, fetchTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSend = async () => {
    const hasText = chatInput.trim().length > 0;
    const hasAtt = attachments.length > 0;
    if (chatLoading || (!hasText && !hasAtt)) return;
    const { text: composedMessage, imageAttachments } = composeMessage(chatInput);
    clearAttachments(); setChatInput('');
    try { await send(composedMessage, imageAttachments); } catch (err) { console.error('[ScrollDetailModal] send:', err); }
  };

  const handleRefreshTab = useCallback((tab: TabId) => {
    if (agent) fetchTab(tab, agent.id);
  }, [agent, fetchTab]);

  if (!agent) return null;

  const statusColor = { online: '#00f0ff', busy: '#ffd700', slacking: '#39ff14', offline: '#666' }[realTimeStatus] || '#666';
  const statusLabel = { online: '在线', busy: '忙碌', slacking: '摸鱼', offline: '离线' }[realTimeStatus] || realTimeStatus;

  const tabsProps = {
    agent, activeTab, onTabChange: setActiveTab, realTimeStatus, memories,
    profileInfo, skills, logs, soul, config, env, globalMemory, globalUser,
    loading, errors, onRefresh: handleRefreshTab,
    messages, chatLoading, chatInput, setChatInput, handleSend,
    attachments, fileError, isDragOver, fileInputRef,
    addFiles, removeAttachment, clearAttachments,
    handlePaste, dropHandlers, openFilePicker, messagesEndRef,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={handleOverlayClick}>
          <motion.div className="relative flex flex-col rounded-2xl overflow-hidden" style={{ width: 'min(900px, 90vw)', height: 'min(700px, 85vh)', background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(0,240,255,0.2)', boxShadow: '0 0 40px rgba(0,240,255,0.1), 0 0 80px rgba(0,0,0,0.5)' }} initial={{ scale: 0, opacity: 0, borderRadius: '50%' }} animate={{ scale: 1, opacity: 1, borderRadius: 16 }} exit={{ scale: 0.2, opacity: 0, borderRadius: '50%' }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <div className="absolute top-0 left-0 right-0 h-3 rounded-t-2xl" style={{ background: 'linear-gradient(180deg, #8B4513, #5c2e0c)', borderTop: '2px solid #ffd700', boxShadow: '0 -2px 8px rgba(255,215,0,0.3)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b-2xl" style={{ background: 'linear-gradient(180deg, #5c2e0c, #8B4513)', borderBottom: '2px solid #ffd700', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }} />

            <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.15)' }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: '#ffd700' }}>{agent.name}</h2>
                  <p className="text-[11px]" style={{ color: '#9ca3af' }}>{agent.title}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded ml-2" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>{statusLabel}</span>
              </div>
              <button className="p-1.5 rounded hover:bg-white/10 transition-colors" onClick={onClose}>
                <X size={18} color="#e0e0e0" />
              </button>
            </div>

            <AgentProfileTabs {...tabsProps} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
