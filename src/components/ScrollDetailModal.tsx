import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, Memory } from '../data';
import type { ChatMessage } from '../types/hermes';
import type { AgentMemoryMap } from '../hooks/useAgentMemory';
import { X, Send, Clock, Zap, FileText, MessageSquare, Plus, Image as ImageIcon, FileCode } from 'lucide-react';
import { useChat } from '../hooks/useHermes';
import { useAttachments } from '../hooks/useAttachments';
import { useAgentStatus } from '../hooks/useAgentStatus';

interface ScrollDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  memories?: AgentMemoryMap;
}

export default function ScrollDetailModal({ agent, isOpen, onClose, memories }: ScrollDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    attachments, fileError, isDragOver, fileInputRef,
    addFiles, removeAttachment, clearAttachments,
    handlePaste, dropHandlers, composeMessage, openFilePicker,
  } = useAttachments();

  const { statuses } = useAgentStatus(agent ? [agent] : []);
  const realTimeStatus = statuses.find((s) => s.id === agent?.id)?.status || agent?.status || 'online';

  const agentMemories: Memory[] = (agent && memories && memories[agent.id])
    ? memories[agent.id]
    : (agent?.memory || []);

  const chatCtx = agent ? {
    agentId: agent.id,
    agentName: agent.name,
    isMainAgent: agent.department === '首辅',
  } : null;

  const { messages, send, loading } = useChat(chatCtx || { agentId: '', agentName: '', isMainAgent: true });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSend = async () => {
    const hasText = chatInput.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (loading || (!hasText && !hasAttachments)) return;

    const { text: composedMessage, imageAttachments } = composeMessage(chatInput);
    clearAttachments();
    setChatInput('');

    try {
      await send(composedMessage, imageAttachments);
    } catch (err) {
      console.error('[ScrollDetailModal] handleSend error:', err);
    }
  };

  if (!agent) return null;

  const statusColor = { online: '#00f0ff', busy: '#ffd700', slacking: '#39ff14', offline: '#666' }[realTimeStatus];
  const statusLabel = { online: '在线', busy: '忙碌', slacking: '摸鱼', offline: '离线' }[realTimeStatus];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={handleOverlayClick}>
          <motion.div className="relative flex flex-col rounded-2xl overflow-hidden" style={{ width: 'min(900px, 90vw)', height: 'min(700px, 85vh)', background: 'rgba(10, 10, 15, 0.95)', border: '1px solid rgba(0,240,255,0.2)', boxShadow: '0 0 40px rgba(0,240,255,0.1), 0 0 80px rgba(0,0,0,0.5)' }} initial={{ scale: 0, opacity: 0, borderRadius: '50%' }} animate={{ scale: 1, opacity: 1, borderRadius: 16 }} exit={{ scale: 0.2, opacity: 0, borderRadius: '50%' }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <div className="absolute top-0 left-0 right-0 h-3 rounded-t-2xl" style={{ background: 'linear-gradient(180deg, #8B4513, #5c2e0c)', borderTop: '2px solid #ffd700', boxShadow: '0 -2px 8px rgba(255,215,0,0.3)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b-2xl" style={{ background: 'linear-gradient(180deg, #5c2e0c, #8B4513)', borderBottom: '2px solid #ffd700', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }} />

            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,240,255,0.15)' }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: '#ffd700' }}>{agent.name}</h2>
                  <p className="text-[11px]" style={{ color: '#9ca3af' }}>{agent.title}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded ml-2" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                  {statusLabel}
                </span>
              </div>
              <button className="p-1.5 rounded hover:bg-white/10 transition-colors" onClick={onClose}>
                <X size={18} color="#e0e0e0" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-[30%] border-r overflow-y-auto px-4 py-4" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} color="#00f0ff" />
                  <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>配置文档</span>
                </div>
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#e0e0e0' }}>
                  <span style={{ color: '#ffd700' }}>{agent.config}</span>
                </pre>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-[35%] border-b px-4 py-3 overflow-y-auto" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} color="#ffd700" />
                    <span className="text-xs font-bold" style={{ color: '#ffd700' }}>技能列表</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {agent.skills.map((skill, idx) => (
                      <motion.div key={idx} className="rounded-lg px-3 py-2 border cursor-default" style={{ borderColor: 'rgba(0,240,255,0.15)', background: 'rgba(0,240,255,0.05)' }} whileHover={{ borderColor: 'rgba(0,240,255,0.4)', boxShadow: '0 0 12px rgba(0,240,255,0.15)' }}>
                        <p className="text-xs font-medium" style={{ color: '#e0e0e0' }}>{skill.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{skill.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="h-[35%] border-b px-4 py-3 overflow-y-auto" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} color="#ffd700" />
                    <span className="text-xs font-bold" style={{ color: '#ffd700' }}>工作记录</span>
                  </div>
                  <div className="space-y-2">
                    {agentMemories.map((mem, idx) => (
                      <div key={idx} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full" style={{ background: mem.type === 'error' ? '#ff2a6d' : '#ffd700', boxShadow: `0 0 6px ${mem.type === 'error' ? '#ff2a6d' : '#ffd700'}` }} />
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
                  </div>
                </div>

                <div className="h-[30%] flex flex-col px-4 py-3" {...dropHandlers}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} color="#00f0ff" />
                    <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>即时交互</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                    {messages.map((msg: ChatMessage) => (
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
                      disabled={loading}
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
                      disabled={loading || (!chatInput.trim() && attachments.length === 0)}
                    >
                      <Send size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
