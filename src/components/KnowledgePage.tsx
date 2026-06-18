import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  Search,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  BookOpen,
  Clock,
  BookMarked,
  RefreshCw,
  Wifi,
  WifiOff,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  FolderPlus,
  Shield,
  Eye,
} from 'lucide-react';
import { agents } from '../data';

type AgentRole = 'shoufu' | 'cangbu' | 'libu' | 'hubu' | 'libu2' | 'bingbu' | 'xingbu' | 'gongbu' | 'yibu';

const KNOWLEDGE_ADMINS: AgentRole[] = ['shoufu', 'cangbu'];

function agentIdToRole(id: string): AgentRole | null {
  const map: Record<string, AgentRole> = {
    shoufu: 'shoufu',
    cangbu: 'cangbu',
    libu: 'libu',
    hubu: 'hubu',
    libu2: 'libu2',
    bingbu: 'bingbu',
    xingbu: 'xingbu',
    gongbu: 'gongbu',
    yibu: 'yibu',
  };
  return map[id] || null;
}

function isAdmin(role: AgentRole | null): boolean {
  return role !== null && KNOWLEDGE_ADMINS.includes(role);
}

interface DocNode {
  name: string;
  path: string;
  type: 'folder' | 'doc';
  children?: DocNode[];
  size?: number;
  updatedAt?: string;
  content?: string;
}

interface VaultInfo {
  vault: string;
  path: string;
  tree: DocNode[];
}

export default function KnowledgePage() {
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeRole, setActiveRole] = useState<AgentRole>('shoufu');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileParent, setNewFileParent] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const canWrite = isAdmin(activeRole);

  const roleHeaders = useMemo(() => ({ 'X-Agent-Role': activeRole }), [activeRole]);

  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch('/obsidian-api/api/tree');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVaultInfo(data);
      setError(null);
      setLastRefresh(new Date());
      if (data.tree.length > 0 && !expanded.size) {
        setExpanded(new Set([data.tree[0].path]));
      }
    } catch {
      setError('无法连接知识库服务');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFile = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/obsidian-api/api/file/${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSelectedDoc(data);
    } catch {
      setSelectedDoc({ name: 'Error', path: filePath, type: 'doc', content: '无法加载文件内容' });
    }
  }, []);

  useEffect(() => {
    fetchTree();
    const interval = setInterval(fetchTree, 30000);
    return () => clearInterval(interval);
  }, [fetchTree]);

  const allDocs = useMemo(() => {
    if (!vaultInfo) return [];
    const docs: DocNode[] = [];
    const flatten = (nodes: DocNode[]) => {
      for (const n of nodes) {
        if (n.type === 'doc') docs.push(n);
        if (n.children) flatten(n.children);
      }
    };
    flatten(vaultInfo.tree);
    return docs;
  }, [vaultInfo]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allDocs.filter((d) => d.name.toLowerCase().includes(q));
  }, [searchQuery, allDocs]);

  const toggleFolder = (folderPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const handleSelectDoc = (doc: DocNode) => {
    setSelectedPath(doc.path);
    setEditing(false);
    fetchFile(doc.path);
  };

  const handleStartEdit = () => {
    if (!selectedDoc || !canWrite) return;
    setEditContent(selectedDoc.content || '');
    setEditing(true);
    setActionError(null);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditContent('');
    setActionError(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedPath || !canWrite) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/obsidian-api/api/file/${encodeURIComponent(selectedPath)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...roleHeaders },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `保存失败 (${res.status})`);
      }
      setEditing(false);
      await fetchFile(selectedPath);
      await fetchTree();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedPath || !canWrite) return;
    setActionError(null);
    try {
      const res = await fetch(`/obsidian-api/api/file/${encodeURIComponent(selectedPath)}`, {
        method: 'DELETE',
        headers: roleHeaders,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `删除失败 (${res.status})`);
      }
      setSelectedPath(null);
      setSelectedDoc(null);
      setEditing(false);
      await fetchTree();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '删除失败');
    }
  };

  const handleCreateFile = async () => {
    if (!canWrite || !newFileName.trim()) return;
    setActionError(null);
    const name = newFileName.trim().endsWith('.md') ? newFileName.trim() : `${newFileName.trim()}.md`;
    const relPath = newFileParent ? `${newFileParent}/${name}` : name;
    try {
      const res = await fetch('/obsidian-api/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...roleHeaders },
        body: JSON.stringify({ path: relPath, content: `# ${name.replace('.md', '')}\n\n` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `创建失败 (${res.status})`);
      }
      setShowNewFile(false);
      setNewFileName('');
      setNewFileParent('');
      await fetchTree();
      setSelectedPath(relPath);
      await fetchFile(relPath);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '创建文件失败');
    }
  };

  const handleCreateFolder = async () => {
    if (!canWrite || !newFolderName.trim()) return;
    setActionError(null);
    const relPath = newFolderParent ? `${newFolderParent}/${newFolderName.trim()}` : newFolderName.trim();
    try {
      const res = await fetch('/obsidian-api/api/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...roleHeaders },
        body: JSON.stringify({ path: relPath }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `创建失败 (${res.status})`);
      }
      setShowNewFolder(false);
      setNewFolderName('');
      setNewFolderParent('');
      await fetchTree();
      setExpanded((prev) => new Set([...prev, relPath]));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '创建文件夹失败');
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    if (!canWrite) return;
    setActionError(null);
    try {
      const res = await fetch(`/obsidian-api/api/folder/${encodeURIComponent(folderPath)}`, {
        method: 'DELETE',
        headers: roleHeaders,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `删除失败 (${res.status})`);
      }
      await fetchTree();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '删除文件夹失败');
    }
  };

  const renderTree = (nodes: DocNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isOpen = expanded.has(node.path);
        return (
          <div key={node.path}>
            <div
              className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] hover:bg-white/5 transition-colors group"
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => toggleFolder(node.path)}>
                <ChevronRight size={11} style={{ color: '#666', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                {isOpen ? <FolderOpen size={12} color="#7c3aed" /> : <Folder size={12} color="#7c3aed" />}
                <span className="flex-1 truncate" style={{ color: '#e0e0e0' }}>{node.name}</span>
                <span className="text-[9px]" style={{ color: '#666' }}>{node.children?.length || 0}</span>
              </button>
              {canWrite && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-0.5 rounded hover:bg-white/10"
                    title="新建文件"
                    onClick={() => { setShowNewFile(true); setNewFileParent(node.path); setNewFileName(''); }}
                  >
                    <Plus size={10} color="#00f0ff" />
                  </button>
                  <button
                    className="p-0.5 rounded hover:bg-white/10"
                    title="新建文件夹"
                    onClick={() => { setShowNewFolder(true); setNewFolderParent(node.path); setNewFolderName(''); }}
                  >
                    <FolderPlus size={10} color="#7c3aed" />
                  </button>
                  <button
                    className="p-0.5 rounded hover:bg-red-500/20"
                    title="删除文件夹"
                    onClick={() => handleDeleteFolder(node.path)}
                  >
                    <Trash2 size={10} color="#ff2a6d" />
                  </button>
                </div>
              )}
            </div>
            <AnimatePresence>
              {isOpen && node.children && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  {renderTree(node.children, depth + 1)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }
      return (
        <button
          key={node.path}
          className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] transition-colors"
          style={{
            paddingLeft: 8 + depth * 12 + 12,
            background: selectedPath === node.path ? 'rgba(0,240,255,0.1)' : 'transparent',
            color: selectedPath === node.path ? '#00f0ff' : '#9ca3af',
          }}
          onClick={() => handleSelectDoc(node)}
        >
          <FileText size={11} />
          <span className="flex-1 text-left truncate">{node.name}</span>
          {node.updatedAt && (
            <span className="text-[8px]" style={{ color: '#666' }}>
              {new Date(node.updatedAt).toLocaleDateString('zh-CN')}
            </span>
          )}
        </button>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: '#666' }}>
        <RefreshCw size={24} className="animate-spin" />
        <p className="text-sm mt-3">加载知识库…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: '#ff2a6d' }}>
        <WifiOff size={32} />
        <p className="text-sm mt-3">{error}</p>
        <p className="text-[11px] mt-2" style={{ color: '#666' }}>
          请先启动知识库服务：node scripts/obsidian-server.js
        </p>
        <button
          className="mt-4 px-4 py-2 rounded text-xs"
          style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff' }}
          onClick={fetchTree}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookMarked size={16} color="#00f0ff" />
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
            知识库
          </h1>
          {vaultInfo && (
            <>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                {vaultInfo.vault}
              </span>
              <span className="text-[10px]" style={{ color: '#666' }}>
                {allDocs.length} 篇文档
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#666' }}>
              <Wifi size={10} color="#00f0ff" />
              更新于 {lastRefresh.toLocaleTimeString('zh-CN')}
            </span>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 rounded border" style={{ borderColor: canWrite ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.08)', background: canWrite ? 'rgba(0,240,255,0.06)' : 'rgba(100,100,100,0.1)' }}>
            {canWrite ? <Shield size={10} color="#00f0ff" /> : <Eye size={10} color="#666" />}
            <select
              value={activeRole}
              onChange={(e) => { setActiveRole(e.target.value as AgentRole); setEditing(false); setActionError(null); }}
              className="bg-transparent outline-none text-[10px] cursor-pointer"
              style={{ color: canWrite ? '#00f0ff' : '#9ca3af' }}
            >
              {agents.map((a) => {
                const role = agentIdToRole(a.id);
                if (!role) return null;
                return (
                  <option key={a.id} value={role} style={{ background: '#1a1a2e', color: '#e0e0e0' }}>
                    {a.name}（{a.department}）{isAdmin(role) ? ' ✦' : ''}
                  </option>
                );
              })}
            </select>
            <span className="text-[9px]" style={{ color: canWrite ? '#00f0ff' : '#666' }}>
              {canWrite ? '可编辑' : '只读'}
            </span>
          </div>

          {canWrite && (
            <>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
                style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
                onClick={() => { setShowNewFile(true); setNewFileParent(''); setNewFileName(''); }}
              >
                <Plus size={10} />
                新建文件
              </button>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}
                onClick={() => { setShowNewFolder(true); setNewFolderParent(''); setNewFolderName(''); }}
              >
                <FolderPlus size={10} />
                新建文件夹
              </button>
            </>
          )}

          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
            style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}
            onClick={fetchTree}
          >
            <RefreshCw size={10} />
            刷新
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mx-6 mb-2 px-3 py-1.5 rounded text-[10px] border flex items-center justify-between" style={{ background: 'rgba(255,42,109,0.1)', borderColor: 'rgba(255,42,109,0.2)', color: '#ff2a6d' }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}><X size={10} color="#ff2a6d" /></button>
        </div>
      )}

      {/* 主体三栏布局 */}
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

          {/* 新建文件/文件夹弹窗 */}
          <AnimatePresence>
            {showNewFile && canWrite && (
              <motion.div
                className="px-3 py-2 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(0,240,255,0.15)', background: 'rgba(0,240,255,0.04)' }}
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              >
                <p className="text-[9px] mb-1" style={{ color: '#666' }}>
                  新建文件 {newFileParent ? `在 ${newFileParent}` : '（根目录）'}
                </p>
                <div className="flex gap-1">
                  <input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="文件名（自动加 .md）"
                    className="flex-1 bg-transparent outline-none text-[10px] px-2 py-1 rounded border"
                    style={{ borderColor: 'rgba(0,240,255,0.2)', color: '#e0e0e0' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                    autoFocus
                  />
                  <button className="p-1 rounded" style={{ color: '#00f0ff' }} onClick={handleCreateFile}><Check size={12} /></button>
                  <button className="p-1 rounded" style={{ color: '#666' }} onClick={() => setShowNewFile(false)}><X size={12} /></button>
                </div>
              </motion.div>
            )}
            {showNewFolder && canWrite && (
              <motion.div
                className="px-3 py-2 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(124,58,237,0.04)' }}
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              >
                <p className="text-[9px] mb-1" style={{ color: '#666' }}>
                  新建文件夹 {newFolderParent ? `在 ${newFolderParent}` : '（根目录）'}
                </p>
                <div className="flex gap-1">
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="文件夹名"
                    className="flex-1 bg-transparent outline-none text-[10px] px-2 py-1 rounded border"
                    style={{ borderColor: 'rgba(124,58,237,0.2)', color: '#e0e0e0' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    autoFocus
                  />
                  <button className="p-1 rounded" style={{ color: '#7c3aed' }} onClick={handleCreateFolder}><Check size={12} /></button>
                  <button className="p-1 rounded" style={{ color: '#666' }} onClick={() => setShowNewFolder(false)}><X size={12} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 文件树 */}
          <div className="flex-1 overflow-y-auto py-1">
            {searchQuery.trim() ? (
              <div className="px-2 py-1">
                <p className="text-[9px] px-2 mb-1" style={{ color: '#666' }}>
                  搜索结果 ({searchResults.length})
                </p>
                {searchResults.map((doc) => (
                  <button
                    key={doc.path}
                    className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-[11px] hover:bg-white/5"
                    style={{ color: '#9ca3af' }}
                    onClick={() => {
                      handleSelectDoc(doc);
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
            ) : vaultInfo ? (
              renderTree(vaultInfo.tree)
            ) : null}
          </div>

          {/* 底部统计 */}
          <div className="px-3 py-2 border-t flex items-center justify-between text-[9px] flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)', color: '#666' }}>
            <span>自动刷新 30s</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f0ff' }} />
              已连接
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
              <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                      {selectedDoc.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: '#666' }}>
                      <span className="px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                        <FileText size={9} />
                        Obsidian
                      </span>
                      {selectedDoc.updatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {new Date(selectedDoc.updatedAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                      {selectedDoc.size && <span>{(selectedDoc.size / 1024).toFixed(1)} KB</span>}
                      {editing && (
                        <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff' }}>编辑中</span>
                      )}
                    </div>
                  </div>
                  {canWrite && !editing && (
                    <div className="flex items-center gap-1">
                      <motion.button className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStartEdit}>
                        <Pencil size={10} />编辑
                      </motion.button>
                      <motion.button className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(255,42,109,0.1)', border: '1px solid rgba(255,42,109,0.2)', color: '#ff2a6d' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { if (window.confirm(`确定要删除 "${selectedDoc.name}" 吗？`)) handleDeleteFile(); }}>
                        <Trash2 size={10} />删除
                      </motion.button>
                    </div>
                  )}
                  {editing && (
                    <div className="flex items-center gap-1">
                      <motion.button className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveEdit} disabled={saving}>
                        <Check size={10} />{saving ? '保存中…' : '保存'}
                      </motion.button>
                      <motion.button className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(100,100,100,0.15)', border: '1px solid rgba(100,100,100,0.2)', color: '#9ca3af' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancelEdit} disabled={saving}>
                        <X size={10} />取消
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4" style={{ color: '#e0e0e0' }}>
                {editing ? (
                  <textarea ref={editRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-full bg-transparent outline-none resize-none text-xs font-mono leading-relaxed" style={{ color: '#e0e0e0' }} disabled={saving} />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      urlTransform={(url) => { const t = url.trim(); if (/^(javascript|data|vbscript):/i.test(t)) return ''; return t; }}
                    >
                      {selectedDoc.content || '（此文档暂无内容）'}
                    </ReactMarkdown>
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
