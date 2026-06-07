/** ============================================================
 *  NewChatPage — 新建对话页面（Marvis 风格）
 *  顶部Logo + 输入框 + 推荐任务卡片
 *  ============================================================ */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, ArrowUp, Plane, Cpu, Presentation, Receipt, BookOpen, Film } from 'lucide-react';

const categories = ['推荐', '办公学习', '电脑设置', '生活日常', '游戏娱乐'];

const taskCards = [
  {
    id: 1,
    title: '深京航班特价速查',
    desc: '帮我在飞常准App查询一下【下周六】【深圳】飞【北京】的机票，结合时间和价格给...',
    icon: Plane,
    color: '#00f0ff',
    category: '生活日常',
  },
  {
    id: 2,
    title: '机器人概念核心标的盘点',
    desc: '帮我在同花顺里，看下机器人/人形机器人概念板块，查看板块内个股的涨跌、市值、PE 等...',
    icon: Cpu,
    color: '#ffd700',
    category: '办公学习',
  },
  {
    id: 3,
    title: '白皮书秒变PPT',
    desc: '我需要做一个PPT用于宣讲前沿知识，相关参考材料在这：...',
    icon: Presentation,
    color: '#39ff14',
    category: '办公学习',
  },
  {
    id: 4,
    title: '本地发票整理&报销',
    desc: '查找本机最近一个季度的发票文件，识别关键信息后整理为 Excel 表格。【搜索规则】 - ...',
    icon: Receipt,
    color: '#ff2a6d',
    category: '办公学习',
  },
  {
    id: 5,
    title: '5min速通arXiv论文！',
    desc: '请帮我深度拆解这篇论文 (https://arxiv.org/abs/2410.21276)，按...',
    icon: BookOpen,
    color: '#00f0ff',
    category: '办公学习',
  },
  {
    id: 6,
    title: '不用刷半小时豆瓣',
    desc: '帮我找下最近有没有口碑好的悬疑电影，周末窝在沙发上看正合适。工作步骤：1、联网...',
    icon: Film,
    color: '#ffd700',
    category: '游戏娱乐',
  },
];

export default function NewChatPage() {
  const [activeCategory, setActiveCategory] = useState('推荐');
  const [inputValue, setInputValue] = useState('');

  const filteredCards = activeCategory === '推荐'
    ? taskCards
    : taskCards.filter((c) => c.category === activeCategory);

  return (
    <div className="flex flex-col items-center justify-start h-full overflow-y-auto px-6 py-8">
      {/* ── 顶部 Logo 区域 ── */}
      <motion.div
        className="flex flex-col items-center mb-8 mt-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(255,215,0,0.15))',
            border: '1px solid rgba(0,240,255,0.3)',
            boxShadow: '0 0 20px rgba(0,240,255,0.1), 0 0 40px rgba(255,215,0,0.05)',
          }}
        >
          <span className="text-2xl font-black" style={{ color: '#00f0ff' }}>H</span>
        </div>
        <h1 className="text-xl font-black tracking-wider" style={{ color: '#e0e0e0' }}>
          Hermes
        </h1>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
          赛博宫廷 · 为你24小时随时在线
        </p>
      </motion.div>

      {/* ── 输入框区域 ── */}
      <motion.div
        className="w-full max-w-2xl rounded-xl border flex flex-col"
        style={{
          borderColor: 'rgba(0,240,255,0.2)',
          background: 'rgba(10,10,15,0.6)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <textarea
          className="w-full bg-transparent text-sm px-5 pt-4 pb-2 outline-none resize-none"
          style={{ color: '#e0e0e0', minHeight: 80 }}
          placeholder="请输入任务，交给我来帮你完成"
          rows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]"
            style={{
              background: 'rgba(0,240,255,0.08)',
              border: '1px solid rgba(0,240,255,0.15)',
              color: '#00f0ff',
            }}
            whileHover={{ background: 'rgba(0,240,255,0.15)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={12} />
            <span>选择文件</span>
          </motion.button>
          <motion.button
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              background: inputValue.trim()
                ? 'linear-gradient(135deg, #00f0ff, #0099cc)'
                : 'rgba(0,240,255,0.1)',
              border: '1px solid rgba(0,240,255,0.2)',
              color: '#fff',
              boxShadow: inputValue.trim() ? '0 0 12px rgba(0,240,255,0.3)' : 'none',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── 推荐任务区域 ── */}
      <motion.div
        className="w-full max-w-3xl mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* 分类标签 */}
        <div className="flex items-center gap-4 mb-4 px-1">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              className="text-[11px] transition-colors relative"
              style={{
                color: activeCategory === cat ? '#00f0ff' : '#666',
                fontWeight: activeCategory === cat ? 700 : 400,
              }}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ color: '#9ca3af' }}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px rounded-full"
                  style={{ background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }}
                  layoutId="category-indicator"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* 任务卡片网格 */}
        <div className="grid grid-cols-3 gap-3">
          {filteredCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                className="rounded-lg border p-3 cursor-pointer group"
                style={{
                  borderColor: 'rgba(0,240,255,0.08)',
                  background: 'rgba(0,0,0,0.3)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.05, duration: 0.3 }}
                whileHover={{
                  borderColor: 'rgba(0,240,255,0.3)',
                  boxShadow: `0 0 12px ${card.color}22`,
                  background: 'rgba(0,240,255,0.03)',
                }}
                onClick={() => setInputValue(card.title)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} color={card.color} />
                  <span className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>
                    {card.title}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed line-clamp-2 mb-2" style={{ color: '#666' }}>
                  {card.desc}
                </p>
                <div className="flex justify-end">
                  <ArrowUp
                    size={12}
                    className="transition-colors"
                    style={{ color: '#444' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
