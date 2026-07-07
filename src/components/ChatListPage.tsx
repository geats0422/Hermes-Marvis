import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Plus, SendHorizontal, Square, ArrowLeft, Clock, X, Image as ImageIcon, FileCode, FileText, Wrench } from 'lucide-react';
import { useSessions, useChat, useHermesHealth } from '../hooks/useHermes';
import { useAttachments } from '../hooks/useAttachments';
import type { AgentChatContext } from '../types/hermes';

export default function ChatListPage() {
  const { sessions, loading, refresh, remove } = useSessions();
  const { online } = useHermesHealth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const {
    attachments, fileError, isDragOver, fileInputRef,
    addFiles, removeAttachment, clearAttachments,
    handlePaste, dropHandlers, composeMessage, openFilePicker,
  } = useAttachments();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const ctx: AgentChatContext = activeSession
    ? { agentId: 'shoufu', agentName: activeSession.title || 'Hermes', sessionId: activeSession.id, isMainAgent: true }
    : { agentId: 'shoufu', agentName: '首辅', isMainAgent: true };

  const { messages, send, stop, loading: chatLoading } = useChat(ctx);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const hasText = inputValue.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (chatLoading || (!hasText && !hasAttachments)) return;

    const { text: composedMessage, imageAttachments } = composeMessage(inputValue);
    clearAttachments();
    setInputValue('');

    await send(composedMessage, imageAttachments);
    refresh();
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInputValue('');
  };

  if (activeSessionId && activeSession) {
    return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(10,10,15,0.9)' }}>
          <motion.button onClick={() => setActiveSessionId(null)} className="p-1.5 rounded-lg" style={{ background: 'rgba(0,240,255,0.08)', color: '#00f0ff' }} whileHover={{ background: 'rgba(0,240,255,0.15)' }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft size={16} />
          </motion.button>
          <div className="w-2 h-2 rounded-full" style={{ background: online ? '#00f0ff' : '#666', boxShadow: online ? '0 0 6px #00f0ff' : 'none' }} />
          <span className="text-sm font-bold truncate" style={{ color: '#e0e0e0' }}>{activeSession.title || 'Hermes 对话'}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <motion.div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="max-w-[70%] rounded-xl px-4 py-2.5 text-sm leading-relaxed" style={{ background: msg.role === 'user' ? 'rgba(0,240,255,0.12)' : 'rgba(255,215,0,0.08)', border: `1px solid ${msg.role === 'user' ? 'rgba(0,240,255,0.2)' : 'rgba(255,215,0,0.15)'}`, color: '#e0e0e0' }}>
                {msg.role === 'agent' && <div className="text-[10px] font-bold mb-1" style={{ color: '#ffd700' }}>{activeSession.title || 'Hermes'}</div>}
                {msg.imageUrls && msg.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.imageUrls.map((url, i) => (
                      <img key={i} src={url} alt={`附件 ${i + 1}`} className="max-w-[200px] max-h-[160px] rounded-lg cursor-pointer object-cover border" style={{ borderColor: 'rgba(0,240,255,0.2)' }} onClick={() => setPreviewImage(url)} />
                    ))}
                  </div>
                )}
                {msg.toolEvents && msg.toolEvents.length > 0 && msg.streaming && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.toolEvents.slice(-3).map((ev, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{
                        background: ev.type === 'failed' ? 'rgba(255,42,109,0.1)' : ev.type === 'completed' ? 'rgba(57,255,20,0.08)' : 'rgba(0,240,255,0.08)',
                        color: ev.type === 'failed' ? '#ff2a6d' : ev.type === 'completed' ? '#39ff14' : '#00f0ff',
                      }}>
                        <Wrench size={8} />
                        {ev.type === 'started' ? '调用' : ev.type === 'completed' ? '完成' : '失败'} {ev.toolName}
                      </span>
                    ))}
                  </div>
                )}
                {msg.streaming && !msg.text ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffd700', animation: 'breathe 1.4s ease-in-out infinite' }} />
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffd700', animation: 'breathe 1.4s ease-in-out 0.2s infinite' }} />
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffd700', animation: 'breathe 1.4s ease-in-out 0.4s infinite' }} />
                    </div>
                    <span className="text-[10px]" style={{ color: '#ffd700' }}>
                      {msg.toolEvents && msg.toolEvents.length > 0 ? '执行工具中…' : '思考中…'}
                    </span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {msg.text}
                    {msg.streaming && msg.text && (
                      <span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle" style={{ background: '#ffd700', animation: 'breathe 1s ease-in-out infinite' }} />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-8" style={{ color: '#666' }}><p className="text-sm">发送第一条消息开始对话</p></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {attachments.length > 0 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(10,10,15,0.9)' }}>
            {attachments.map((att) => (
              <div key={att.id} className="relative flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] border" style={{ background: 'rgba(0,240,255,0.06)', borderColor: 'rgba(0,240,255,0.15)' }}>
                {att.type === 'image' && att.dataUrl ? <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover" /> : att.type === 'image' ? <ImageIcon size={12} color="#00f0ff" /> : att.type === 'text' ? <FileCode size={12} color="#00f0ff" /> : <FileText size={12} color="#00f0ff" />}
                <span className="max-w-[100px] truncate" style={{ color: '#e0e0e0' }}>{att.name}</span>
                <button onClick={() => removeAttachment(att.id)} className="p-0.5 rounded hover:bg-white/10"><X size={10} color="#9ca3af" /></button>
              </div>
            ))}
          </div>
        )}
        {fileError && (
          <div className="px-6 py-1" style={{ background: 'rgba(10,10,15,0.9)' }}>
            <span className="text-[10px]" style={{ color: '#ff2a6d' }}>{fileError}</span>
          </div>
        )}

        <div
          className="px-6 py-4 border-t flex-shrink-0"
          style={{
            borderColor: isDragOver ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.1)',
            background: isDragOver ? 'rgba(0,240,255,0.05)' : 'rgba(10,10,15,0.9)',
          }}
          {...dropHandlers}
        >
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files!)} />
            <motion.button
              className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)', color: '#00f0ff' }}
              whileHover={{ background: 'rgba(0,240,255,0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={openFilePicker}
            >
              <Plus size={18} />
            </motion.button>
            <textarea
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: isDragOver ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.2)', color: '#e0e0e0', minHeight: 42, maxHeight: 120 }}
              placeholder="输入消息… (Shift+Enter 换行, 可粘贴图片/文件)"
              rows={1}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); e.target.style.height = '42px'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              onPaste={handlePaste}
              disabled={chatLoading}
            />
            {chatLoading ? (
              <motion.button className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.3)', color: '#fff' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={stop} title="停止输出">
                <Square size={10} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ background: (inputValue.trim() || attachments.length > 0) ? 'linear-gradient(135deg, #00f0ff, #0099cc)' : 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: (inputValue.trim() || attachments.length > 0) ? '#fff' : '#666' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={!inputValue.trim() && attachments.length === 0}>
                <SendHorizontal size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.img src={previewImage} alt="预览" className="max-w-[90vw] max-h-[85vh] rounded-lg" style={{ boxShadow: '0 0 40px rgba(0,240,255,0.2)' }} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} onClick={(e) => e.stopPropagation()} />
            <button className="absolute top-6 right-6 p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setPreviewImage(null)}>
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(10,10,15,0.9)' }}>
        <div className="flex items-center gap-3">
          <MessageSquare size={18} color="#00f0ff" />
          <h1 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>对话列表</h1>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>{sessions.length} 条</span>
        </div>
        <motion.button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }} whileHover={{ background: 'rgba(0,240,255,0.2)' }} whileTap={{ scale: 0.95 }} onClick={handleNewChat}>
          <Plus size={12} /><span>新建对话</span>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="text-center py-8" style={{ color: '#666' }}><p className="text-sm">加载中…</p></div>
        )}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-12" style={{ color: '#666' }}>
            <MessageSquare size={32} className="mx-auto mb-3" style={{ color: '#444' }} />
            <p className="text-sm">暂无对话记录</p>
            <p className="text-[11px] mt-1">点击「新建对话」开始</p>
          </div>
        )}
        {!loading && sessions.map((session, idx) => (
          <motion.div key={session.id} className="rounded-lg border px-4 py-3 cursor-pointer group" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(0,0,0,0.2)' }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03, duration: 0.3 }} whileHover={{ borderColor: 'rgba(0,240,255,0.3)', background: 'rgba(0,240,255,0.03)' }} onClick={() => setActiveSessionId(session.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
                <span className="text-xs font-bold truncate" style={{ color: '#e0e0e0' }}>{session.title || '无标题'}</span>
              </div>
              <motion.button className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity" style={{ color: '#ff2a6d' }} whileHover={{ background: 'rgba(255,42,109,0.1)' }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); remove(session.id); }}>
                <Trash2 size={12} />
              </motion.button>
            </div>
            <div className="flex items-center gap-3 mt-1.5 ml-4">
              <span className="text-[10px] flex items-center gap-1" style={{ color: '#666' }}><Clock size={10} />{new Date(session.last_active * 1000).toLocaleString('zh-CN')}</span>
              <span className="text-[10px]" style={{ color: '#444' }}>{session.message_count} 条消息</span>
              {(session.input_tokens > 0 || session.output_tokens > 0) && (
                <span className="text-[10px]" style={{ color: '#444' }}>
                  {((session.input_tokens + session.output_tokens) / 1000).toFixed(1)}k tokens
                </span>
              )}
              {session.estimated_cost_usd != null && session.estimated_cost_usd > 0 && (
                <span className="text-[10px]" style={{ color: '#444' }}>${session.estimated_cost_usd.toFixed(4)}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
