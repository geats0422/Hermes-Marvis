/** ============================================================
 *  KnowledgePage — 知识库页面
 *  读取本地 Obsidian + LLM Wiki 构建的知识库
 *  左侧文件夹树 + 右侧文档预览
 *  ============================================================ */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  BookOpen,
  Tag,
  Clock,
  BookMarked,
  Link2,
  FileCode,
  Network,
} from 'lucide-react';

type Source = 'obsidian' | 'llm-wiki' | 'all';

interface DocNode {
  id: string;
  name: string;
  type: 'folder' | 'doc';
  children?: DocNode[];
  source?: 'obsidian' | 'llm-wiki';
  tags?: string[];
  updatedAt?: string;
  content?: string;
  links?: string[];
}

const knowledgeTree: DocNode[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Vault',
    type: 'folder',
    source: 'obsidian',
    children: [
      {
        id: 'ob-daily',
        name: '📅 每日笔记',
        type: 'folder',
        children: [
          { id: 'd-1', name: '2026-06-05.md', type: 'doc', source: 'obsidian', updatedAt: '2天前', tags: ['日记'], content: '今日主要完成了 Hermes Agent 系统的初步框架搭建...' },
          { id: 'd-2', name: '2026-06-06.md', type: 'doc', source: 'obsidian', updatedAt: '昨天', tags: ['日记', '会议'], content: '与团队讨论了 Hermes 的多 Agent 协同方案...' },
          { id: 'd-3', name: '2026-06-07.md', type: 'doc', source: 'obsidian', updatedAt: '今天', tags: ['日记'], content: '今天集中处理了 LLM Wiki 与 Obsidian 的同步问题...' },
        ],
      },
      {
        id: 'ob-projects',
        name: '🚀 项目文档',
        type: 'folder',
        children: [
          { id: 'p-1', name: 'Hermes 系统设计.md', type: 'doc', source: 'obsidian', updatedAt: '3小时前', tags: ['系统', '架构'], content: '# Hermes Agent 系统设计\n\n## 概述\n本系统采用分层架构设计...', links: ['p-2', 'p-3'] },
          { id: 'p-2', name: '首辅调度算法.md', type: 'doc', source: 'obsidian', updatedAt: '昨天', tags: ['算法', '调度'], content: '# 首辅调度算法\n\n## 优先级队列\n基于任务权重...', links: ['p-1'] },
          { id: 'p-3', name: '九部职责划分.md', type: 'doc', source: 'obsidian', updatedAt: '2天前', tags: ['架构'], content: '# 九部职责\n\n- 吏部：人事管理\n- 户部：资源管理\n...' },
        ],
      },
      {
        id: 'ob-research',
        name: '🔬 技术研究',
        type: 'folder',
        children: [
          { id: 'r-1', name: 'RAG 检索增强.md', type: 'doc', source: 'obsidian', updatedAt: '5天前', tags: ['AI', 'RAG'], content: '# RAG 检索增强生成\n\nRAG 通过检索外部知识库...' },
          { id: 'r-2', name: 'Prompt Engineering.md', type: 'doc', source: 'obsidian', updatedAt: '1周前', tags: ['AI'], content: '# Prompt 工程' },
        ],
      },
    ],
  },
  {
    id: 'llm-wiki',
    name: 'LLM Wiki',
    type: 'folder',
    source: 'llm-wiki',
    children: [
      {
        id: 'lw-topics',
        name: '📚 主题库',
        type: 'folder',
        children: [
          { id: 't-1', name: 'Transformer 架构.md', type: 'doc', source: 'llm-wiki', updatedAt: '实时同步', tags: ['LLM', '架构'], content: '# Transformer 架构\n\nTransformer 是基于自注意力机制的神经网络...', links: ['t-2', 't-3'] },
          { id: 't-2', name: 'Self-Attention 机制.md', type: 'doc', source: 'llm-wiki', updatedAt: '实时同步', tags: ['LLM'], content: '# Self-Attention\n\n自注意力机制计算 Query/Key/Value...' },
          { id: 't-3', name: 'Multi-Head Attention.md', type: 'doc', source: 'llm-wiki', updatedAt: '实时同步', tags: ['LLM'], content: '# Multi-Head Attention' },
        ],
      },
      {
        id: 'lw-skills',
        name: '⚙️ 技能词条',
        type: 'folder',
        children: [
          { id: 's-1', name: 'RAG 检索.md', type: 'doc', source: 'llm-wiki', updatedAt: '实时同步', tags: ['RAG', '技能'], content: '# RAG 检索技能\n\n通过向量数据库 + 语义检索实现...' },
          { id: 's-2', name: '工具调用 Function Calling.md', type: 'doc', source: 'llm-wiki', updatedAt: '实时同步', tags: ['Agent', '工具'], content: '# Function Calling\n\n让 LLM 调用外部 API...' },
        ],
      },
    ],
  },
];

const sourceColor: Record<string, string> = {
  obsidian: '#7c3aed',
  'llm-wiki': '#00f0ff',
};

const sourceLabel: Record<string, string> = {
  obsidian: 'Obsidian',
  'llm-wiki': 'LLM Wiki',
};

export default function KnowledgePage() {
  const [source, setSource] = useState<Source>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['obsidian', 'ob-projects', 'llm-wiki', 'lw-topics']));
  const [selectedId, setSelectedId] = useState<string>('p-1');
  const [searchQuery, setSearchQuery] = useState('');

  /* 递归查找文档 */
  const findDoc = (nodes: DocNode[], id: string): DocNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const r = findDoc(n.children, id);
        if (r) return r;
      }
    }
    return null;
  };

  /* 平铺所有文档 */
  const flattenDocs = (nodes: DocNode[]): DocNode[] => {
    const out: DocNode[] = [];
    for (const n of nodes) {
      if (n.type === 'doc') {
        if (source === 'all' || n.source === source) out.push(n);
      }
      if (n.children) out.push(...flattenDocs(n.children));
    }
    return out;
  };

  const allDocs = useMemo(() => flattenDocs(knowledgeTree), [source]);
  const selectedDoc = findDoc(knowledgeTree, selectedId);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allDocs.filter(
      (d) => d.name.toLowerCase().includes(q) || (d.content && d.content.toLowerCase().includes(q))
    );
  }, [searchQuery, allDocs]);

  const toggleFolder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* 渲染树 */
  const renderTree = (nodes: DocNode[], depth = 0) => {
    return nodes.map((node) => {
      if (source !== 'all' && node.source && node.source !== source) return null;
      if (node.type === 'folder') {
        const isOpen = expanded.has(node.id);
        return (
          <div key={node.id}>
            <button
              className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] hover:bg-white/5 transition-colors"
              style={{ paddingLeft: 8 + depth * 12 }}
              onClick={() => toggleFolder(node.id)}
            >
              <ChevronRight
                size={11}
                style={{
                  color: '#666',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
              {isOpen ? (
                <FolderOpen size={12} color={node.source ? sourceColor[node.source] : '#9ca3af'} />
              ) : (
                <Folder size={12} color={node.source ? sourceColor[node.source] : '#9ca3af'} />
              )}
              <span className="flex-1 text-left truncate" style={{ color: '#e0e0e0' }}>
                {node.name}
              </span>
              {node.source && (
                <span
                  className="text-[8px] px-1 rounded"
                  style={{ background: `${sourceColor[node.source]}20`, color: sourceColor[node.source] }}
                >
                  {sourceLabel[node.source]}
                </span>
              )}
            </button>
            <AnimatePresence>
              {isOpen && node.children && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {renderTree(node.children, depth + 1)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }
      return (
        <button
          key={node.id}
          className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] transition-colors"
          style={{
            paddingLeft: 8 + depth * 12 + 12,
            background: selectedId === node.id ? 'rgba(0,240,255,0.1)' : 'transparent',
            color: selectedId === node.id ? '#00f0ff' : '#9ca3af',
          }}
          onClick={() => setSelectedId(node.id)}
        >
          <FileText size={11} />
          <span className="flex-1 text-left truncate">{node.name}</span>
          {node.source && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: sourceColor[node.source] }}
            />
          )}
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部标题区 ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookMarked size={16} color="#00f0ff" />
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
            知识库
          </h1>
          <span className="text-[10px] ml-2" style={{ color: '#666' }}>
            {allDocs.length} 篇文档
          </span>
        </div>

        {/* 来源切换 */}
        <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.1)' }}>
          {(['all', 'obsidian', 'llm-wiki'] as Source[]).map((s) => (
            <button
              key={s}
              className="px-2.5 py-1 rounded text-[10px] transition-colors"
              style={{
                background: source === s ? 'rgba(0,240,255,0.15)' : 'transparent',
                color: source === s ? '#00f0ff' : '#9ca3af',
                fontWeight: source === s ? 700 : 400,
              }}
              onClick={() => setSource(s)}
            >
              {s === 'all' ? '全部' : sourceLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── 主体三栏布局 ── */}
      <div className="flex-1 flex min-h-0 px-6 pb-4 gap-3">
        {/* 左侧：文件树 */}
        <div
          className="w-64 flex-shrink-0 rounded-lg border overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
        >
          {/* 搜索 */}
          <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.08)' }}
            >
              <Search size={10} color="#666" />
              <input
                type="text"
                placeholder="搜索知识库"
                className="flex-1 bg-transparent outline-none text-[10px]"
                style={{ color: '#e0e0e0' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 文件树 */}
          <div className="flex-1 overflow-y-auto py-1">
            {searchQuery.trim() ? (
              <div className="px-2 py-1">
                <p className="text-[9px] px-2 mb-1" style={{ color: '#666' }}>
                  搜索结果 ({searchResults.length})
                </p>
                {searchResults.map((doc) => (
                  <button
                    key={doc.id}
                    className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] hover:bg-white/5"
                    style={{ color: '#9ca3af' }}
                    onClick={() => {
                      setSelectedId(doc.id);
                      setSearchQuery('');
                    }}
                  >
                    <FileText size={11} />
                    <span className="flex-1 text-left truncate">{doc.name}</span>
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-[10px] text-center py-4" style={{ color: '#666' }}>
                    未找到匹配结果
                  </p>
                )}
              </div>
            ) : (
              renderTree(knowledgeTree)
            )}
          </div>

          {/* 底部统计 */}
          <div className="px-3 py-2 border-t flex items-center gap-3 text-[9px] flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)', color: '#666' }}>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sourceColor.obsidian }} />
              Obsidian
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sourceColor['llm-wiki'] }} />
              LLM Wiki
            </span>
          </div>
        </div>

        {/* 右侧：文档预览 */}
        <div
          className="flex-1 rounded-lg border overflow-hidden flex flex-col min-w-0"
          style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
        >
          {selectedDoc ? (
            <>
              {/* 文档头部 */}
              <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                      {selectedDoc.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: '#666' }}>
                      {selectedDoc.source && (
                        <span
                          className="px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{ background: `${sourceColor[selectedDoc.source]}15`, color: sourceColor[selectedDoc.source] }}
                        >
                          {selectedDoc.source === 'obsidian' ? <FileCode size={9} /> : <Network size={9} />}
                          {sourceLabel[selectedDoc.source]}
                        </span>
                      )}
                      {selectedDoc.updatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {selectedDoc.updatedAt}
                        </span>
                      )}
                      {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag size={9} />
                          {selectedDoc.tags.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 文档内容 */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <pre
                  className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans"
                  style={{ color: '#e0e0e0' }}
                >
                  {selectedDoc.content || '（此文档暂无内容预览）'}
                </pre>

                {/* 链接列表 */}
                {selectedDoc.links && selectedDoc.links.length > 0 && (
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                    <p className="text-[10px] mb-2 flex items-center gap-1" style={{ color: '#666' }}>
                      <Link2 size={10} />
                      相关链接
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.links.map((link) => {
                        const linkedDoc = findDoc(knowledgeTree, link);
                        return (
                          <button
                            key={link}
                            className="px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors"
                            style={{
                              background: 'rgba(0,240,255,0.05)',
                              border: '1px solid rgba(0,240,255,0.15)',
                              color: '#00f0ff',
                            }}
                            onClick={() => linkedDoc && setSelectedId(link)}
                          >
                            <FileText size={9} />
                            {linkedDoc?.name || link}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ color: '#666' }}>
              <BookOpen size={32} color="#666" />
              <p className="text-xs mt-2">从左侧选择一个文档</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
