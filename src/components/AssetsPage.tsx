/** ============================================================
 *  AssetsPage — 素材库页面
 *  展示知识库（Obsidian + LLM Wiki）中引用的素材
 *  网格布局 + 分类筛选 + 来源筛选
 *  ============================================================ */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Archive,
  Filter,
  Grid3x3,
  List,
  Eye,
  Download,
} from 'lucide-react';

type AssetType = 'image' | 'pdf' | 'video' | 'audio' | 'archive' | 'all';
type AssetSource = 'obsidian' | 'llm-wiki' | 'all';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video' | 'audio' | 'archive';
  size: string;
  source: 'obsidian' | 'llm-wiki';
  refDoc: string;     // 引用的文档
  addedAt: string;
  color: string;      // 缩略图底色
  ext: string;        // 文件扩展名
}

const assets: Asset[] = [
  // 图片类
  { id: 'a-1', name: 'hermes-architecture.png', type: 'image', size: '1.2 MB', source: 'obsidian', refDoc: 'Hermes 系统设计.md', addedAt: '今天', color: 'linear-gradient(135deg, #00f0ff33, #0099cc33)', ext: 'PNG' },
  { id: 'a-2', name: 'attention-mechanism.png', type: 'image', size: '856 KB', source: 'llm-wiki', refDoc: 'Self-Attention 机制.md', addedAt: '昨天', color: 'linear-gradient(135deg, #ffd70033, #ff880033)', ext: 'PNG' },
  { id: 'a-3', name: 'transformer-diagram.jpg', type: 'image', size: '2.1 MB', source: 'llm-wiki', refDoc: 'Transformer 架构.md', addedAt: '2天前', color: 'linear-gradient(135deg, #39ff1433, #00cc8833)', ext: 'JPG' },
  { id: 'a-4', name: 'workflow-chart.svg', type: 'image', size: '124 KB', source: 'obsidian', refDoc: '首辅调度算法.md', addedAt: '3天前', color: 'linear-gradient(135deg, #ff2a6d33, #aa003333)', ext: 'SVG' },
  { id: 'a-5', name: 'rag-pipeline.png', type: 'image', size: '1.5 MB', source: 'llm-wiki', refDoc: 'RAG 检索.md', addedAt: '5天前', color: 'linear-gradient(135deg, #00f0ff33, #39ff1433)', ext: 'PNG' },
  { id: 'a-6', name: 'screenshot-dashboard.png', type: 'image', size: '3.2 MB', source: 'obsidian', refDoc: '2026-06-07.md', addedAt: '今天', color: 'linear-gradient(135deg, #ffd70033, #00f0ff33)', ext: 'PNG' },

  // PDF
  { id: 'a-7', name: 'Hermes-技术白皮书.pdf', type: 'pdf', size: '4.8 MB', source: 'obsidian', refDoc: 'Hermes 系统设计.md', addedAt: '1周前', color: 'linear-gradient(135deg, #ff2a6d22, #ff880022)', ext: 'PDF' },
  { id: 'a-8', name: 'Agent论文-综述.pdf', type: 'pdf', size: '12.3 MB', source: 'llm-wiki', refDoc: 'Multi-Head Attention.md', addedAt: '2周前', color: 'linear-gradient(135deg, #ff2a6d22, #ffd70022)', ext: 'PDF' },

  // 视频
  { id: 'a-9', name: 'demo-presentation.mp4', type: 'video', size: '48.2 MB', source: 'obsidian', refDoc: '2026-06-05.md', addedAt: '3天前', color: 'linear-gradient(135deg, #00f0ff22, #ffd70022)', ext: 'MP4' },

  // 音频
  { id: 'a-10', name: 'meeting-recording.mp3', type: 'audio', size: '8.4 MB', source: 'obsidian', refDoc: '2026-06-06.md', addedAt: '昨天', color: 'linear-gradient(135deg, #39ff1422, #00f0ff22)', ext: 'MP3' },

  // 压缩包
  { id: 'a-11', name: 'project-assets.zip', type: 'archive', size: '156 MB', source: 'obsidian', refDoc: 'Hermes 系统设计.md', addedAt: '1周前', color: 'linear-gradient(135deg, #ffd70022, #ff880022)', ext: 'ZIP' },
  { id: 'a-12', name: 'model-weights.tar.gz', type: 'archive', size: '2.3 GB', source: 'llm-wiki', refDoc: 'Transformer 架构.md', addedAt: '1月前', color: 'linear-gradient(135deg, #ff2a6d22, #00f0ff22)', ext: 'TAR' },
];

const typeConfig: Record<Asset['type'], { icon: React.ElementType; color: string; label: string }> = {
  image: { icon: ImageIcon, color: '#00f0ff', label: '图片' },
  pdf: { icon: FileText, color: '#ff2a6d', label: 'PDF' },
  video: { icon: Film, color: '#ffd700', label: '视频' },
  audio: { icon: Music, color: '#39ff14', label: '音频' },
  archive: { icon: Archive, color: '#ff8800', label: '压缩包' },
};

const sourceColor: Record<string, string> = {
  obsidian: '#7c3aed',
  'llm-wiki': '#00f0ff',
};

export default function AssetsPage() {
  const [activeType, setActiveType] = useState<AssetType>('all');
  const [activeSource, setActiveSource] = useState<AssetSource>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  /* 统计 */
  const typeStats = useMemo(() => {
    const stats: Record<AssetType, number> = { all: assets.length, image: 0, pdf: 0, video: 0, audio: 0, archive: 0 };
    assets.forEach((a) => { stats[a.type]++; });
    return stats;
  }, []);

  /* 过滤 */
  const filtered = useMemo(() => {
    let result = assets;
    if (activeType !== 'all') result = result.filter((a) => a.type === activeType);
    if (activeSource !== 'all') result = result.filter((a) => a.source === activeSource);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || a.refDoc.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeType, activeSource, searchQuery]);

  const typeFilters: { value: AssetType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'image', label: '图片' },
    { value: 'pdf', label: 'PDF' },
    { value: 'video', label: '视频' },
    { value: 'audio', label: '音频' },
    { value: 'archive', label: '压缩包' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部标题 ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} color="#ffd700" />
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
            素材库
          </h1>
          <span className="text-[10px] ml-2" style={{ color: '#666' }}>
            {assets.length} 个素材
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.1)' }}>
            <button
              className="p-1 rounded"
              style={{ background: view === 'grid' ? 'rgba(0,240,255,0.15)' : 'transparent', color: view === 'grid' ? '#00f0ff' : '#666' }}
              onClick={() => setView('grid')}
            >
              <Grid3x3 size={11} />
            </button>
            <button
              className="p-1 rounded"
              style={{ background: view === 'list' ? 'rgba(0,240,255,0.15)' : 'transparent', color: view === 'list' ? '#00f0ff' : '#666' }}
              onClick={() => setView('list')}
            >
              <List size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 工具栏 ── */}
      <div className="flex items-center justify-between px-6 pb-3 flex-shrink-0 flex-wrap gap-2">
        {/* 类型筛选 */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {typeFilters.map((f) => {
            const Icon = f.value === 'all' ? Filter : typeConfig[f.value as Asset['type']]?.icon;
            const color = f.value === 'all' ? '#00f0ff' : typeConfig[f.value as Asset['type']]?.color;
            return (
              <motion.button
                key={f.value}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap"
                style={{
                  background: activeType === f.value ? `${color}15` : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${activeType === f.value ? `${color}50` : 'rgba(0,240,255,0.08)'}`,
                  color: activeType === f.value ? color : '#9ca3af',
                  fontWeight: activeType === f.value ? 700 : 400,
                }}
                whileHover={{ background: activeType === f.value ? `${color}25` : 'rgba(0,0,0,0.4)' }}
                onClick={() => setActiveType(f.value)}
              >
                {Icon && <Icon size={10} />}
                <span>{f.label}</span>
                <span className="text-[8px] opacity-60">({typeStats[f.value]})</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 来源切换 */}
          <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.1)' }}>
            {(['all', 'obsidian', 'llm-wiki'] as AssetSource[]).map((s) => (
              <button
                key={s}
                className="px-2.5 py-1 rounded text-[10px]"
                style={{
                  background: activeSource === s ? 'rgba(0,240,255,0.15)' : 'transparent',
                  color: activeSource === s ? '#00f0ff' : '#9ca3af',
                }}
                onClick={() => setActiveSource(s)}
              >
                {s === 'all' ? '全部' : s === 'obsidian' ? 'Obsidian' : 'LLM Wiki'}
              </button>
            ))}
          </div>

          {/* 搜索 */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.1)' }}
          >
            <Search size={11} color="#666" />
            <input
              type="text"
              placeholder="搜索素材"
              className="bg-transparent outline-none text-[10px] w-20"
              style={{ color: '#e0e0e0' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 素材网格/列表 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageIcon size={32} color="#666" />
            <p className="text-xs mt-2" style={{ color: '#666' }}>未找到匹配的素材</p>
          </div>
        ) : view === 'grid' ? (
          <motion.div
            className="grid grid-cols-4 gap-3"
            layout
          >
            <AnimatePresence>
              {filtered.map((asset, idx) => {
                const TypeIcon = typeConfig[asset.type].icon;
                const typeColor = typeConfig[asset.type].color;
                return (
                  <motion.div
                    key={asset.id}
                    className="rounded-lg border overflow-hidden cursor-pointer group"
                    style={{
                      borderColor: 'rgba(0,240,255,0.1)',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    layout
                    whileHover={{
                      borderColor: `${typeColor}50`,
                      boxShadow: `0 0 12px ${typeColor}20`,
                    }}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    {/* 缩略图 */}
                    <div
                      className="aspect-video flex items-center justify-center relative"
                      style={{ background: asset.color }}
                    >
                      <TypeIcon size={32} color={typeColor} />
                      <div
                        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: 'rgba(0,0,0,0.6)', color: typeColor }}
                      >
                        {asset.ext}
                      </div>
                    </div>

                    {/* 信息 */}
                    <div className="p-2.5">
                      <p className="text-[11px] font-medium truncate" style={{ color: '#e0e0e0' }}>
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className="text-[9px] px-1 rounded flex items-center gap-1"
                          style={{ background: `${sourceColor[asset.source]}20`, color: sourceColor[asset.source] }}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ background: sourceColor[asset.source] }} />
                          {asset.source === 'obsidian' ? 'Obsidian' : 'LLM Wiki'}
                        </span>
                        <span className="text-[9px]" style={{ color: '#666' }}>{asset.size}</span>
                      </div>
                      <p className="text-[9px] mt-1 truncate" style={{ color: '#666' }}>
                        引用自：{asset.refDoc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── 列表视图 ── */
          <div className="space-y-1.5">
            {filtered.map((asset, idx) => {
              const TypeIcon = typeConfig[asset.type].icon;
              const typeColor = typeConfig[asset.type].color;
              return (
                <motion.div
                  key={asset.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer"
                  style={{
                    borderColor: 'rgba(0,240,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  whileHover={{ borderColor: `${typeColor}40` }}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: asset.color }}
                  >
                    <TypeIcon size={14} color={typeColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: '#e0e0e0' }}>
                      {asset.name}
                    </p>
                    <p className="text-[9px] truncate" style={{ color: '#666' }}>
                      引用自：{asset.refDoc}
                    </p>
                  </div>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ background: `${sourceColor[asset.source]}15`, color: sourceColor[asset.source] }}
                  >
                    {asset.source === 'obsidian' ? 'Obsidian' : 'LLM Wiki'}
                  </span>
                  <span className="text-[9px] w-16 text-right" style={{ color: '#666' }}>{asset.size}</span>
                  <span className="text-[9px] w-12 text-right" style={{ color: '#666' }}>{asset.addedAt}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 素材详情弹窗 ── */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              className="rounded-xl overflow-hidden max-w-md w-full mx-4"
              style={{
                background: 'rgba(10,10,15,0.95)',
                border: `1px solid ${typeConfig[selectedAsset.type].color}40`,
                boxShadow: `0 0 30px ${typeConfig[selectedAsset.type].color}20`,
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="aspect-video flex items-center justify-center"
                style={{ background: selectedAsset.color }}
              >
                {(() => {
                  const TypeIcon = typeConfig[selectedAsset.type].icon;
                  return <TypeIcon size={48} color={typeConfig[selectedAsset.type].color} />;
                })()}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold truncate" style={{ color: '#e0e0e0' }}>
                  {selectedAsset.name}
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                  <div>
                    <span style={{ color: '#666' }}>类型：</span>
                    <span style={{ color: '#9ca3af' }}>{typeConfig[selectedAsset.type].label}</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>大小：</span>
                    <span style={{ color: '#9ca3af' }}>{selectedAsset.size}</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>来源：</span>
                    <span style={{ color: sourceColor[selectedAsset.source] }}>
                      {selectedAsset.source === 'obsidian' ? 'Obsidian' : 'LLM Wiki'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>添加：</span>
                    <span style={{ color: '#9ca3af' }}>{selectedAsset.addedAt}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                  <p className="text-[10px]" style={{ color: '#666' }}>引用文档</p>
                  <p className="text-[11px] mt-1" style={{ color: '#00f0ff' }}>{selectedAsset.refDoc}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <motion.button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[11px]"
                    style={{
                      background: `${typeConfig[selectedAsset.type].color}15`,
                      border: `1px solid ${typeConfig[selectedAsset.type].color}40`,
                      color: typeConfig[selectedAsset.type].color,
                    }}
                    whileHover={{ background: `${typeConfig[selectedAsset.type].color}25` }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Eye size={12} />
                    预览
                  </motion.button>
                  <motion.button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[11px]"
                    style={{
                      background: 'rgba(0,240,255,0.08)',
                      border: '1px solid rgba(0,240,255,0.2)',
                      color: '#00f0ff',
                    }}
                    whileHover={{ background: 'rgba(0,240,255,0.15)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Download size={12} />
                    下载
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
