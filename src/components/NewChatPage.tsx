import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, SendHorizontal, Square, ArrowUp, Plane, Cpu, Presentation, Receipt, BookOpen, Film, X, FileText, Image as ImageIcon, FileCode, ArrowLeft, Wrench } from 'lucide-react';
import { useChat, useHermesHealth } from '../hooks/useHermes';
import { useAttachments, formatSize } from '../hooks/useAttachments';
import type { AgentChatContext } from '../types/hermes';

const categories = ['推荐', '办公学习', '电脑设置', '生活日常', '游戏娱乐'];

const taskCards = [
  { id: 1, title: '深京航班特价速查', desc: '帮我在飞常准App查询一下【下周六】【深圳】飞【北京】的机票，结合时间和价格给...', icon: Plane, color: '#00f0ff', category: '生活日常' },
  { id: 2, title: '机器人概念核心标的盘点', desc: '帮我在同花顺里，看下机器人/人形机器人概念板块，查看板块内个股的涨跌、市值、PE 等...', icon: Cpu, color: '#ffd700', category: '办公学习' },
  { id: 3, title: '白皮书秒变PPT', desc: '我需要做一个PPT用于宣讲前沿知识，相关参考材料在这：...', icon: Presentation, color: '#39ff14', category: '办公学习' },
  { id: 4, title: '本地发票整理&报销', desc: '查找本机最近一个季度的发票文件，识别关键信息后整理为 Excel 表格。【搜索规则】 - ...', icon: Receipt, color: '#ff2a6d', category: '办公学习' },
  { id: 5, title: '5min速通arXiv论文！', desc: '请帮我深度拆解这篇论文 (https://arxiv.org/abs/2410.21276)，按...', icon: BookOpen, color: '#00f0ff', category: '办公学习' },
  { id: 6, title: '不用刷半小时豆瓣', desc: '帮我找下最近有没有口碑好的悬疑电影，周末窝在沙发上看正合适。工作步骤：1、联网...', icon: Film, color: '#ffd700', category: '游戏娱乐' },
];

const defaultCtx: AgentChatContext = {
  agentId: 'shoufu',
  agentName: '首辅',
  isMainAgent: true,
};

export default function NewChatPage() {
  const [activeCategory, setActiveCategory] = useState('推荐');
  const [inputValue, setInputValue] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { online } = useHermesHealth();
  const { messages, send, stop, loading } = useChat(defaultCtx);
  const {
    attachments, fileError, isDragOver, fileInputRef,
    addFiles, removeAttachment, clearAttachments,
    handlePaste, dropHandlers, composeMessage, openFilePicker,
  } = useAttachments();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const hasText = inputValue.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (loading || (!hasText && !hasAttachments)) return;

    setChatStarted(true);
    const { text: composedMessage, imageAttachments } = composeMessage(inputValue);
    clearAttachments();
    setInputValue('');

    try {
      await send(composedMessage, imageAttachments);
    } catch (err) {
      console.error('[NewChatPage] handleSend error:', err);
    }
  };

  const handleBack = () => {
    setChatStarted(false);
  };

  const filteredCards = activeCategory === '推荐' ? taskCards : taskCards.filter((c) => c.category === activeCategory);

  if (chatStarted) {
    return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(10,10,15,0.9)' }}>
          <motion.button
            onClick={handleBack}
            className="p-1.5 rounded-lg"
            style={{ background: 'rgba(0,240,255,0.08)', color: '#00f0ff' }}
            whileHover={{ background: 'rgba(0,240,255,0.15)' }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div className="w-2 h-2 rounded-full" style={{ background: online ? '#00f0ff' : '#666', boxShadow: online ? '0 0 6px #00f0ff' : 'none' }} />
          <span className="text-sm font-bold" style={{ color: '#e0e0e0' }}>首辅</span>
          <span className="text-[10px]" style={{ color: '#666' }}>Hermes 总控调度</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="max-w-[70%] rounded-xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user' ? 'rgba(0,240,255,0.12)' : 'rgba(255,215,0,0.08)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,240,255,0.2)' : 'rgba(255,215,0,0.15)'}`,
                  color: '#e0e0e0',
                }}
              >
                {msg.role === 'agent' && (
                  <div className="text-[10px] font-bold mb-1" style={{ color: '#ffd700' }}>首辅</div>
                )}
                {msg.imageUrls && msg.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`附件 ${i + 1}`}
                        className="max-w-[200px] max-h-[160px] rounded-lg cursor-pointer object-cover border"
                        style={{ borderColor: 'rgba(0,240,255,0.2)' }}
                        onClick={() => setPreviewImage(url)}
                      />
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
            <div className="text-center py-8" style={{ color: '#666' }}>
              <p className="text-sm">发送第一条消息开始对话</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {attachments.length > 0 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(10,10,15,0.9)' }}>
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] border"
                style={{ background: 'rgba(0,240,255,0.06)', borderColor: 'rgba(0,240,255,0.15)' }}
              >
                {att.type === 'image' && att.dataUrl ? (
                  <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover" />
                ) : att.type === 'image' ? (
                  <ImageIcon size={12} color="#00f0ff" />
                ) : att.type === 'text' ? (
                  <FileCode size={12} color="#00f0ff" />
                ) : (
                  <FileText size={12} color="#00f0ff" />
                )}
                <span className="max-w-[100px] truncate" style={{ color: '#e0e0e0' }}>{att.name}</span>
                <button onClick={() => removeAttachment(att.id)} className="p-0.5 rounded hover:bg-white/10">
                  <X size={10} color="#9ca3af" />
                </button>
              </div>
            ))}
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files!)}
            />
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
              disabled={loading}
            />
            {loading ? (
              <motion.button
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.3)', color: '#fff' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stop}
                title="停止输出"
              >
                <Square size={10} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{
                  background: (inputValue.trim() || attachments.length > 0) ? 'linear-gradient(135deg, #00f0ff, #0099cc)' : 'rgba(0,240,255,0.1)',
                  border: '1px solid rgba(0,240,255,0.2)',
                  color: (inputValue.trim() || attachments.length > 0) ? '#fff' : '#666',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!inputValue.trim() && attachments.length === 0}
              >
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
            <motion.img
              src={previewImage}
              alt="预览"
              className="max-w-[90vw] max-h-[85vh] rounded-lg"
              style={{ boxShadow: '0 0 40px rgba(0,240,255,0.2)' }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-6 right-6 p-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full overflow-y-auto px-6 py-8">
      <motion.div className="flex flex-col items-center mb-8 mt-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(255,215,0,0.15))', border: '1px solid rgba(0,240,255,0.3)', boxShadow: '0 0 20px rgba(0,240,255,0.1), 0 0 40px rgba(255,215,0,0.05)' }}>
          <span className="text-2xl font-black" style={{ color: '#00f0ff' }}>H</span>
        </div>
        <h1 className="text-xl font-black tracking-wider" style={{ color: '#e0e0e0' }}>Hermes</h1>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>赛博宫廷 · 为你24小时随时在线</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: online ? '#00f0ff' : '#666', boxShadow: online ? '0 0 4px #00f0ff' : 'none' }} />
          <span className="text-[10px]" style={{ color: online ? '#00f0ff' : '#666' }}>{online ? 'Hermes 已连接' : 'Hermes 未连接'}</span>
        </div>
      </motion.div>

      <motion.div
        className="w-full max-w-2xl rounded-xl border flex flex-col"
        style={{
          borderColor: isDragOver ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.2)',
          background: isDragOver ? 'rgba(0,240,255,0.05)' : 'rgba(10,10,15,0.6)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        {...dropHandlers}
      >
        <textarea
          className="w-full bg-transparent text-sm px-5 pt-4 pb-2 outline-none resize-none"
          style={{ color: '#e0e0e0', minHeight: 80 }}
          placeholder="请输入任务，交给我来帮你完成（可粘贴图片/文件）"
          rows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          onPaste={handlePaste}
        />

        {attachments.length > 0 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <motion.div
                key={att.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {att.type === 'image' ? <ImageIcon size={10} color="#00f0ff" /> : att.type === 'text' ? <FileCode size={10} color="#00f0ff" /> : <FileText size={10} color="#00f0ff" />}
                <span className="max-w-[120px] truncate" style={{ color: '#e0e0e0' }}>{att.name}</span>
                <span style={{ color: '#666' }}>{formatSize(att.size)}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="ml-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X size={10} color="#9ca3af" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {fileError && (
          <div className="px-5 pb-2">
            <span className="text-[10px]" style={{ color: '#ff2a6d' }}>{fileError}</span>
          </div>
        )}

        <div className="flex items-center justify-between px-4 pb-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files!)}
          />
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)', color: '#00f0ff' }}
            whileHover={{ background: 'rgba(0,240,255,0.15)' }}
            whileTap={{ scale: 0.95 }}
            onClick={openFilePicker}
          >
            <Plus size={12} /><span>选择文件</span>
          </motion.button>
          {loading ? (
            <motion.button
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.3)', color: '#fff' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stop}
              title="停止输出"
            >
              <Square size={10} fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{
                background: (inputValue.trim() || attachments.length > 0) ? 'linear-gradient(135deg, #00f0ff, #0099cc)' : 'rgba(0,240,255,0.1)',
                border: '1px solid rgba(0,240,255,0.2)',
                color: (inputValue.trim() || attachments.length > 0) ? '#fff' : '#666',
                boxShadow: (inputValue.trim() || attachments.length > 0) ? '0 0 12px rgba(0,240,255,0.3)' : 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!inputValue.trim() && attachments.length === 0}
            >
              <SendHorizontal size={14} />
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div className="w-full max-w-3xl mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <div className="flex items-center gap-4 mb-4 px-1">
          {categories.map((cat) => (
            <motion.button key={cat} className="text-[11px] transition-colors relative" style={{ color: activeCategory === cat ? '#00f0ff' : '#666', fontWeight: activeCategory === cat ? 700 : 400 }} onClick={() => setActiveCategory(cat)} whileHover={{ color: '#9ca3af' }}>
              {cat}
              {activeCategory === cat && <motion.div className="absolute -bottom-1 left-0 right-0 h-px rounded-full" style={{ background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} layoutId="category-indicator" />}
            </motion.button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filteredCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.id} className="rounded-lg border p-3 cursor-pointer group" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(0,0,0,0.3)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + idx * 0.05, duration: 0.3 }} whileHover={{ borderColor: 'rgba(0,240,255,0.3)', boxShadow: `0 0 12px ${card.color}22`, background: 'rgba(0,240,255,0.03)' }} onClick={() => setInputValue(card.title)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} color={card.color} />
                  <span className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>{card.title}</span>
                </div>
                <p className="text-[10px] leading-relaxed line-clamp-2 mb-2 flex-1" style={{ color: '#666' }}>{card.desc}</p>
                <div className="flex justify-end"><ArrowUp size={12} className="transition-colors" style={{ color: '#444' }} /></div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
