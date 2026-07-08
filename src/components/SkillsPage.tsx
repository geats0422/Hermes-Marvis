/** ============================================================
 *  SkillsPage — 技能库页面
 *  实时同步 Hermes Agent 的技能和工具集
 *  ============================================================ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Check, Sparkles,
  Wrench, Globe, Image as ImageIcon, Code, Music,
  Gamepad2, Home, BookOpen, Shield, Cpu, Terminal,
  Database, MessageCircle, Network, Zap, Filter,
  RefreshCw, Wifi, WifiOff, Layers,
} from 'lucide-react';
import { getSkills, getToolsets } from '../api/hermes';
import { getGlobalEnabledSkills, enableGlobalSkill, disableGlobalSkill } from '../api/profile';
import type { HermesSkill, HermesToolset } from '../types/hermes';

type ViewMode = 'skills' | 'toolsets';

const categoryIcons: Record<string, React.ElementType> = {
  'autonomous-ai-agents': Cpu,
  'creative': ImageIcon,
  'data-science': Database,
  'devops': Terminal,
  'email': MessageCircle,
  'gaming': Gamepad2,
  'github': Code,
  'mcp': Network,
  'media': Music,
  'mlops': Cpu,
  'note-taking': BookOpen,
  'productivity': Zap,
  'red-teaming': Shield,
  'research': BookOpen,
  'smart-home': Home,
  'social-media': Globe,
  'software-development': Code,
};

const categoryColors: Record<string, string> = {
  'autonomous-ai-agents': '#00f0ff',
  'creative': '#ff2a6d',
  'data-science': '#39ff14',
  'devops': '#ffd700',
  'email': '#00f0ff',
  'gaming': '#ff2a6d',
  'github': '#e0e0e0',
  'mcp': '#ffd700',
  'media': '#ff2a6d',
  'mlops': '#39ff14',
  'note-taking': '#7c3aed',
  'productivity': '#00f0ff',
  'red-teaming': '#ff2a6d',
  'research': '#ffd700',
  'smart-home': '#39ff14',
  'social-media': '#00f0ff',
  'software-development': '#ffd700',
};

const categoryLabels: Record<string, string> = {
  'autonomous-ai-agents': 'AI Agent',
  'creative': '创意',
  'data-science': '数据科学',
  'devops': 'DevOps',
  'email': '邮件',
  'gaming': '游戏',
  'github': 'GitHub',
  'mcp': 'MCP',
  'media': '媒体',
  'mlops': 'MLOps',
  'note-taking': '笔记',
  'productivity': '生产力',
  'red-teaming': '安全测试',
  'research': '研究',
  'smart-home': '智能家居',
  'social-media': '社交媒体',
  'software-development': '软件开发',
};

export default function SkillsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('skills');
  const [skills, setSkills] = useState<HermesSkill[]>([]);
  const [toolsets, setToolsets] = useState<HermesToolset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    getGlobalEnabledSkills()
      .then((ids) => setAdded(new Set(ids)))
      .catch(() => setAdded(new Set()));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [skillsResult, toolsetsResult] = await Promise.allSettled([
        getSkills(),
        getToolsets(),
      ]);
      if (skillsResult.status === 'fulfilled') setSkills(skillsResult.value);
      if (toolsetsResult.status === 'fulfilled') setToolsets(toolsetsResult.value);
      if (skillsResult.status === 'rejected' && toolsetsResult.status === 'rejected') {
        setError(true);
      } else {
        setError(false);
        setLastRefresh(new Date());
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* 提取所有分类 */
  const skillCategories = useMemo(() => {
    const cats = new Set<string>();
    skills.forEach((s) => s.category && cats.add(s.category));
    return ['全部', ...Array.from(cats).sort()];
  }, [skills]);

  /* 过滤技能 */
  const filteredSkills = useMemo(() => {
    let result = skills;
    if (activeCategory !== '全部') {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [skills, activeCategory, searchQuery]);

  /* 过滤工具集 */
  const filteredToolsets = useMemo(() => {
    let result = toolsets;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [toolsets, searchQuery]);

  const handleToggleAdd = async (id: string) => {
    const wasAdded = added.has(id);
    setAdded((prev) => {
      const next = new Set(prev);
      if (wasAdded) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const updated = wasAdded ? await disableGlobalSkill(id) : await enableGlobalSkill(id);
      setAdded(new Set(updated));
    } catch {
      setAdded((prev) => {
        const next = new Set(prev);
        if (wasAdded) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: '#666' }}>
        <RefreshCw size={24} className="animate-spin" />
        <p className="text-sm mt-3">加载技能库…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs tracking-wider" style={{ color: '#666' }}>探索发现</span>
          <span style={{ color: '#444' }}>·</span>
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>技能库</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && !error && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#666' }}>
              <Wifi size={10} color="#00f0ff" />
              更新于 {lastRefresh.toLocaleTimeString('zh-CN')}
            </span>
          )}
          {error && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#ff2a6d' }}>
              <WifiOff size={10} />
              同步失败
            </span>
          )}
          <div className="text-[10px]" style={{ color: '#666' }}>
            Hermes 实时同步 · {skills.length} 技能 / {toolsets.length} 工具集
          </div>
        </div>
      </div>

      {/* 视图切换 + 分类 + 工具栏 */}
      <div className="flex items-center justify-between px-6 pb-3 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.1)' }}>
            <button
              className="px-2.5 py-1 rounded text-[10px] transition-colors flex items-center gap-1"
              style={{
                background: viewMode === 'skills' ? 'rgba(0,240,255,0.15)' : 'transparent',
                color: viewMode === 'skills' ? '#00f0ff' : '#9ca3af',
                fontWeight: viewMode === 'skills' ? 700 : 400,
              }}
              onClick={() => { setViewMode('skills'); setActiveCategory('全部'); }}
            >
              <Sparkles size={10} /> 技能
            </button>
            <button
              className="px-2.5 py-1 rounded text-[10px] transition-colors flex items-center gap-1"
              style={{
                background: viewMode === 'toolsets' ? 'rgba(0,240,255,0.15)' : 'transparent',
                color: viewMode === 'toolsets' ? '#00f0ff' : '#9ca3af',
                fontWeight: viewMode === 'toolsets' ? 700 : 400,
              }}
              onClick={() => setViewMode('toolsets')}
            >
              <Layers size={10} /> 工具集
            </button>
          </div>

          {/* 分类标签 */}
          {viewMode === 'skills' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {skillCategories.map((cat) => (
                <motion.button
                  key={cat}
                  className="px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors"
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
                  {cat === '全部' ? cat : (categoryLabels[cat] || cat)}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.1)' }}
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

          <motion.button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px]"
            style={{
              background: added.size > 0 ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.4)',
              border: `1px solid ${added.size > 0 ? 'rgba(255,215,0,0.3)' : 'rgba(0,240,255,0.1)'}`,
              color: added.size > 0 ? '#ffd700' : '#9ca3af',
            }}
            whileHover={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <Sparkles size={10} />
            <span>已启用 {added.size > 0 && `(${added.size})`}</span>
          </motion.button>

          <motion.button
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
            style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
            whileHover={{ background: 'rgba(0,240,255,0.15)' }}
            onClick={fetchData}
          >
            <RefreshCw size={10} />
            刷新
          </motion.button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: '#ff2a6d' }}>
            <WifiOff size={32} />
            <p className="text-sm mt-3">无法连接 Hermes</p>
            <button
              className="mt-4 px-4 py-2 rounded text-xs"
              style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff' }}
              onClick={fetchData}
            >
              重试
            </button>
          </div>
        ) : viewMode === 'skills' ? (
          <AnimatePresence mode="popLayout">
            {filteredSkills.length > 0 ? (
              <motion.div
                key={activeCategory + searchQuery}
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredSkills.map((skill, idx) => {
                  const Icon = categoryIcons[skill.category || ''] || Wrench;
                  const color = categoryColors[skill.category || ''] || '#00f0ff';
                  const isAdded = added.has(skill.name);
                  return (
                    <motion.div
                      key={skill.name}
                      className="rounded-lg border p-3 flex flex-col group"
                      style={{
                        borderColor: isAdded ? `${color}40` : 'rgba(0,240,255,0.1)',
                        background: isAdded ? `${color}08` : 'rgba(0,0,0,0.3)',
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5), duration: 0.3 }}
                      layout
                      whileHover={{
                        borderColor: `${color}50`,
                        boxShadow: `0 0 12px ${color}20`,
                      }}
                    >
                      <div className="flex items-start gap-2.5 mb-2">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                        >
                          <Icon size={16} color={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>
                            {skill.name}
                          </h3>
                          {skill.category && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color }}>
                                {categoryLabels[skill.category] || skill.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed line-clamp-2 mb-3 flex-1" style={{ color: '#9ca3af' }}>
                        {skill.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px]" style={{ color: '#666' }}>
                          Hermes 已安装
                        </span>
                        <motion.button
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                          style={{
                            background: isAdded ? `${color}20` : 'rgba(0,240,255,0.08)',
                            border: `1px solid ${isAdded ? `${color}50` : 'rgba(0,240,255,0.2)'}`,
                            color: isAdded ? color : '#00f0ff',
                          }}
                          whileHover={{
                            background: isAdded ? `${color}30` : 'rgba(0,240,255,0.15)',
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleAdd(skill.name)}
                        >
                          {isAdded ? (
                            <><Check size={10} /><span>已启用</span></>
                          ) : (
                            <><Plus size={10} /><span>启用</span></>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="empty" className="flex flex-col items-center justify-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.1)' }}>
                  <Search size={20} color="#666" />
                </div>
                <p className="text-xs" style={{ color: '#666' }}>没有找到匹配的技能</p>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* 工具集视图 */
          <AnimatePresence mode="popLayout">
            {filteredToolsets.length > 0 ? (
              <motion.div key="toolsets" className="grid grid-cols-2 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredToolsets.map((toolset, idx) => {
                  const isAdded = added.has(toolset.name);
                  return (
                    <motion.div
                      key={toolset.name}
                      className="rounded-lg border p-3 flex flex-col"
                      style={{
                        borderColor: isAdded ? 'rgba(0,240,255,0.4)' : 'rgba(0,240,255,0.1)',
                        background: isAdded ? 'rgba(0,240,255,0.05)' : 'rgba(0,0,0,0.3)',
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5), duration: 0.3 }}
                      whileHover={{ borderColor: 'rgba(0,240,255,0.3)', boxShadow: '0 0 12px rgba(0,240,255,0.1)' }}
                    >
                      <div className="flex items-start gap-2.5 mb-2">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: toolset.enabled ? 'rgba(0,240,255,0.15)' : 'rgba(100,100,100,0.1)',
                            border: `1px solid ${toolset.enabled ? 'rgba(0,240,255,0.3)' : 'rgba(100,100,100,0.2)'}`,
                          }}
                        >
                          <Layers size={16} color={toolset.enabled ? '#00f0ff' : '#666'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>
                            {toolset.label}
                          </h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded"
                              style={{
                                background: toolset.enabled ? 'rgba(57,255,20,0.15)' : 'rgba(100,100,100,0.15)',
                                color: toolset.enabled ? '#39ff14' : '#666',
                              }}
                            >
                              {toolset.enabled ? '● 已启用' : '○ 未启用'}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded"
                              style={{
                                background: toolset.configured ? 'rgba(0,240,255,0.1)' : 'rgba(255,42,109,0.1)',
                                color: toolset.configured ? '#00f0ff' : '#ff2a6d',
                              }}
                            >
                              {toolset.configured ? '已配置' : '未配置'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed mb-2" style={{ color: '#9ca3af' }}>
                        {toolset.description}
                      </p>
                      {toolset.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {toolset.tools.slice(0, 4).map((tool) => (
                            <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,240,255,0.05)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.15)' }}>
                              {tool}
                            </span>
                          ))}
                          {toolset.tools.length > 4 && (
                            <span className="text-[9px] px-1.5 py-0.5" style={{ color: '#666' }}>
                              +{toolset.tools.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-end mt-auto">
                        <span className="text-[9px] mr-auto" style={{ color: '#666' }}>
                          {toolset.tools.length} 个工具
                        </span>
                        <motion.button
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                          style={{
                            background: isAdded ? 'rgba(0,240,255,0.2)' : 'rgba(0,240,255,0.08)',
                            border: `1px solid ${isAdded ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.2)'}`,
                            color: isAdded ? '#00f0ff' : '#00f0ff',
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleAdd(toolset.name)}
                        >
                          {isAdded ? <><Check size={10} /><span>已关注</span></> : <><Plus size={10} /><span>关注</span></>}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="empty" className="flex flex-col items-center justify-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Filter size={32} color="#666" />
                <p className="text-xs mt-3" style={{ color: '#666' }}>没有找到匹配的工具集</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
