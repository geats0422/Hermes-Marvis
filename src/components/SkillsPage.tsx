/** ============================================================
 *  SkillsPage — 技能库页面
 *  展示 Hermes Agent 的全部本地技能（从 Agent.skills 提取）
 *  赛博宫廷风格
 *  ============================================================ */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Check, SlidersHorizontal, Sparkles,
  Compass, Eye, Shield, Brain,
  UserPlus, Key, RefreshCw, ClipboardList,
  Coins, Wallet, TrendingDown, FileText,
  MessageCircle, Globe, Heart, LayoutTemplate,
  ShieldCheck, Filter, Gauge, Radar,
  Search as SearchIcon, Lock, FileCheck, Trash2,
  Code, Package, TestTube, BookOpen,
  Database, BookMarked, HardDrive, Archive,
  Plug, Webhook, Send, Route,
} from 'lucide-react';
import { agents } from '../data';

const iconMap: Record<string, React.ElementType> = {
  compass: Compass,
  eye: Eye,
  shield: Shield,
  brain: Brain,
  'user-plus': UserPlus,
  key: Key,
  'refresh-cw': RefreshCw,
  'clipboard-list': ClipboardList,
  coins: Coins,
  wallet: Wallet,
  'trending-down': TrendingDown,
  'file-text': FileText,
  'message-circle': MessageCircle,
  globe: Globe,
  heart: Heart,
  'layout-template': LayoutTemplate,
  'shield-check': ShieldCheck,
  filter: Filter,
  gauge: Gauge,
  radar: Radar,
  search: SearchIcon,
  lock: Lock,
  'file-check': FileCheck,
  'trash-2': Trash2,
  code: Code,
  package: Package,
  'test-tube': TestTube,
  'book-open': BookOpen,
  database: Database,
  'book-marked': BookMarked,
  'hard-drive': HardDrive,
  archive: Archive,
  plug: Plug,
  webhook: Webhook,
  send: Send,
  route: Route,
};

interface SkillItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  source: string;        // 部门
  sourceFull: string;    // Agent 名称
  category: string;
  color: string;
  added: boolean;
}

const departmentColor: Record<string, string> = {
  首辅: '#ffd700',
  吏: '#00f0ff',
  户: '#ffd700',
  礼: '#39ff14',
  兵: '#00f0ff',
  刑: '#ff2a6d',
  工: '#ffd700',
  仓: '#00f0ff',
  驿: '#00f0ff',
};

const categoryMap: Record<string, string> = {
  首辅: '调度管理',
  吏: '人事管理',
  户: '资源管理',
  礼: '对话交互',
  兵: '安全防御',
  刑: '合规治理',
  工: '工程开发',
  仓: '数据存储',
  驿: '通信集成',
};

const categoryOrder = ['全部', '调度管理', '人事管理', '资源管理', '对话交互', '安全防御', '合规治理', '工程开发', '数据存储', '通信集成'];

/* ── 展开所有技能（带随机"添加人数"模拟） ── */
function buildSkillList(): SkillItem[] {
  const list: SkillItem[] = [];
  agents.forEach((agent) => {
    agent.skills.forEach((skill, idx) => {
      list.push({
        id: `${agent.id}-${idx}`,
        title: skill.name,
        desc: skill.description,
        icon: skill.icon,
        source: agent.department,
        sourceFull: `${agent.name}`,
        category: categoryMap[agent.department] || '其他',
        color: departmentColor[agent.department] || '#00f0ff',
        added: false,
      });
    });
  });
  return list;
}

export default function SkillsPage() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState<SkillItem[]>(buildSkillList());

  const handleToggleAdd = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, added: !s.added } : s))
    );
  };

  const filtered = useMemo(() => {
    let result = skills;
    if (activeCategory !== '全部') {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
      );
    }
    return result;
  }, [skills, activeCategory, searchQuery]);

  const addedCount = skills.filter((s) => s.added).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部标题区 ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs tracking-wider" style={{ color: '#666' }}>
            探索发现
          </span>
          <span style={{ color: '#444' }}>·</span>
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
            技能库
          </h1>
        </div>
        <div className="text-[10px]" style={{ color: '#666' }}>
          本地部署 · {skills.length} 个技能
        </div>
      </div>

      {/* ── 分类标签 + 工具栏 ── */}
      <div className="flex items-center justify-between px-6 pb-3 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categoryOrder.map((cat) => (
            <motion.button
              key={cat}
              className="px-3 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors"
              style={{
                background: activeCategory === cat ? 'rgba(0,240,255,0.1)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${activeCategory === cat ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)'}`,
                color: activeCategory === cat ? '#00f0ff' : '#9ca3af',
                fontWeight: activeCategory === cat ? 700 : 400,
              }}
              whileHover={{
                background: activeCategory === cat ? 'rgba(0,240,255,0.15)' : 'rgba(0,0,0,0.4)',
              }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 搜索框 */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,240,255,0.1)',
            }}
          >
            <Search size={11} color="#666" />
            <input
              type="text"
              placeholder="搜索技能"
              className="bg-transparent outline-none text-[10px] w-20"
              style={{ color: '#e0e0e0' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 排序 */}
          <motion.button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px]"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,240,255,0.1)',
              color: '#9ca3af',
            }}
            whileHover={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <SlidersHorizontal size={10} />
            <span>本地</span>
          </motion.button>

          {/* 我的技能 */}
          <motion.button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px]"
            style={{
              background: addedCount > 0 ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.4)',
              border: `1px solid ${addedCount > 0 ? 'rgba(255,215,0,0.3)' : 'rgba(0,240,255,0.1)'}`,
              color: addedCount > 0 ? '#ffd700' : '#9ca3af',
            }}
            whileHover={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <Sparkles size={10} />
            <span>我的技能 {addedCount > 0 && `(${addedCount})`}</span>
          </motion.button>
        </div>
      </div>

      {/* ── 技能卡片网格 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key={activeCategory + searchQuery}
              className="grid grid-cols-3 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filtered.map((skill, idx) => {
                const Icon = iconMap[skill.icon] || Sparkles;
                return (
                  <motion.div
                    key={skill.id}
                    className="rounded-lg border p-3 flex flex-col group"
                    style={{
                      borderColor: skill.added ? `${skill.color}40` : 'rgba(0,240,255,0.1)',
                      background: skill.added ? `${skill.color}08` : 'rgba(0,0,0,0.3)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    layout
                    whileHover={{
                      borderColor: `${skill.color}50`,
                      boxShadow: `0 0 12px ${skill.color}20`,
                    }}
                  >
                    <div className="flex items-start gap-2.5 mb-2">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${skill.color}15`,
                          border: `1px solid ${skill.color}30`,
                        }}
                      >
                        <Icon size={16} color={skill.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>
                          {skill.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${skill.color}15`, color: skill.color }}>
                            {skill.source}部
                          </span>
                          <span className="text-[9px]" style={{ color: '#666' }}>
                            {skill.sourceFull}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed line-clamp-2 mb-3 flex-1" style={{ color: '#9ca3af' }}>
                      {skill.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: '#666' }}>
                        本地已部署
                      </span>
                      <motion.button
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                        style={{
                          background: skill.added ? `${skill.color}20` : 'rgba(0,240,255,0.08)',
                          border: `1px solid ${skill.added ? `${skill.color}50` : 'rgba(0,240,255,0.2)'}`,
                          color: skill.added ? skill.color : '#00f0ff',
                        }}
                        whileHover={{
                          background: skill.added ? `${skill.color}30` : 'rgba(0,240,255,0.15)',
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleAdd(skill.id)}
                      >
                        {skill.added ? (
                          <>
                            <Check size={10} />
                            <span>已启用</span>
                          </>
                        ) : (
                          <>
                            <Plus size={10} />
                            <span>启用</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.1)' }}
              >
                <Search size={20} color="#666" />
              </div>
              <p className="text-xs" style={{ color: '#666' }}>
                没有找到匹配的技能
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
