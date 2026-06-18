/** ============================================================
 *  LeftNav — 左侧导航栏（Marvis 风格）
 *  展开态：图标+文字 + 搜索 + 分类（240px）
 *  折叠态：纯图标导航（56px）
 *  折叠状态保持当前状态
 *  ============================================================ */

import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Plus,
  Sparkles,
  Wrench,
  FileText,
  Image as ImageIcon,
  Monitor,
  User,
  Crown,
  MessageSquare,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navStructure: NavGroup[] = [
  {
    items: [
      { id: 'new', label: '新建对话', icon: Plus },
      { id: 'task', label: '自动任务', icon: Sparkles },
      { id: 'skills', label: '技能广场', icon: Wrench },
    ],
  },
  {
    title: '本地知识库',
    items: [
      { id: 'knowledge', label: '知识库', icon: FileText },
      { id: 'assets', label: '素材库', icon: ImageIcon },
      { id: 'device', label: '此电脑', icon: Monitor },
    ],
  },
  {
    title: '对话',
    items: [
      { id: 'workspace', label: '大殿', icon: Crown },
      { id: 'chats', label: '对话记录', icon: MessageSquare },
    ],
  },
];

interface LeftNavProps {
  entryDone: boolean;
  collapsed: boolean;
  onToggle: () => void;
  activeId: string;
  onNavChange: (id: string) => void;
  onOpenSettings: () => void;
}

export default function LeftNav({ entryDone, collapsed, onToggle, activeId, onNavChange, onOpenSettings }: LeftNavProps) {

  return (
    <motion.div
      className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden"
      style={{
        width: collapsed ? 56 : 240,
        borderColor: 'rgba(0,240,255,0.08)',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: entryDone ? 0 : -240, opacity: entryDone ? 1 : 0 }}
      transition={{ delay: 2.5, duration: 0.5, ease: 'easeOut' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          /* === 折叠态：纯图标 === */
          <motion.div
            key="collapsed"
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center h-14 border-b" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff22, #ffd70022)',
                  border: '1px solid rgba(0,240,255,0.3)',
                  color: '#00f0ff',
                }}
              >
                H
              </div>
            </div>

            {/* 扁平化图标导航（所有项目） */}
            <div className="flex-1 flex flex-col items-center gap-1 py-3 overflow-y-auto">
              {navStructure.flatMap((g) => g.items).map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    className="relative flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                    style={{
                      background: isActive ? 'rgba(0,240,255,0.1)' : 'transparent',
                      color: isActive ? '#00f0ff' : '#666',
                    }}
                    whileHover={{ background: 'rgba(0,240,255,0.08)', color: '#9ca3af' }}
                    whileTap={{ scale: 0.95 }}
                  onClick={() => onNavChange(item.id)}
                  title={item.label}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    {isActive && (
                      <motion.div
                        className="absolute left-0 w-0.5 h-5 rounded-full"
                        style={{ background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }}
                        layoutId="left-nav-indicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* 底部：账号 + 展开按钮 */}
            <div className="flex flex-col items-center gap-2 py-3 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <motion.button
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{ background: 'rgba(0,240,255,0.08)', color: '#9ca3af' }}
                title="账号与设置"
                whileHover={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff' }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenSettings}
              >
                <User size={16} />
              </motion.button>
              <motion.button
                className="flex items-center justify-center w-7 h-6 rounded"
                style={{
                  background: 'rgba(0,240,255,0.05)',
                  border: '1px solid rgba(0,240,255,0.15)',
                  color: '#666',
                }}
                onClick={onToggle}
                title="展开"
                whileHover={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}
                whileTap={{ scale: 0.95 }}
              >
                <PanelLeftOpen size={12} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* === 展开态：图标+文字 === */
          <motion.div
            key="expanded"
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo 标题 */}
            <div className="flex items-center justify-between px-5 h-14 border-b" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #00f0ff22, #ffd70022)',
                    border: '1px solid rgba(0,240,255,0.3)',
                    color: '#00f0ff',
                  }}
                >
                  H
                </div>
                <span className="text-sm font-black tracking-wider" style={{ color: '#e0e0e0' }}>
                  Hermes
                </span>
              </div>
              <motion.button
                className="flex items-center justify-center w-7 h-6 rounded"
                style={{
                  background: 'rgba(0,240,255,0.05)',
                  border: '1px solid rgba(0,240,255,0.15)',
                  color: '#666',
                }}
                onClick={onToggle}
                title="折叠"
                whileHover={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}
                whileTap={{ scale: 0.95 }}
              >
                <PanelLeftClose size={12} />
              </motion.button>
            </div>

            {/* 可滚动内容 */}
            <div className="flex-1 overflow-y-auto py-3">
              {/* 搜索框 */}
              <div className="px-3 mb-3">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,240,255,0.1)',
                  }}
                >
                  <Search size={12} color="#666" />
                  <input
                    type="text"
                    placeholder="搜索"
                    className="flex-1 bg-transparent outline-none text-[12px]"
                    style={{ color: '#e0e0e0' }}
                  />
                </div>
              </div>

              {/* 导航分组 */}
              {navStructure.map((group, gIdx) => (
                <div key={gIdx} className="mb-2">
                  {group.title && (
                    <div
                      className="px-5 py-1.5 text-[10px] tracking-wider"
                      style={{ color: '#666' }}
                    >
                      {group.title}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isActive = activeId === item.id;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        className="relative w-full flex items-center gap-2.5 px-5 py-2 text-[12px] transition-colors text-left"
                        style={{
                          background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
                          color: isActive ? '#00f0ff' : '#9ca3af',
                        }}
                        whileHover={{ background: 'rgba(0,240,255,0.05)', color: '#e0e0e0' }}
                        onClick={() => onNavChange(item.id)}
                      >
                        {isActive && (
                          <motion.div
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                            style={{ background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }}
                            layoutId="left-nav-text-indicator"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon size={15} strokeWidth={isActive ? 2.5 : 1.5} />
                        <span className="flex-1 truncate">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 底部：账号与设置 */}
            <div className="flex items-center gap-2 px-3 py-3 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <motion.button
                className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md"
                style={{ background: 'rgba(0,240,255,0.05)' }}
                whileHover={{ background: 'rgba(0,240,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                title="账号与设置"
                onClick={onOpenSettings}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,240,255,0.15)' }}
                >
                  <User size={14} color="#00f0ff" />
                </div>
                <span className="text-[11px] flex-1 text-left" style={{ color: '#9ca3af' }}>
                  账号与设置
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
