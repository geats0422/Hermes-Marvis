import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  Folder,
  FolderOpen,
  RefreshCw,
  FileText,
  File,
  Image as ImageIcon,
  Terminal,
  ChevronRight,
  Home,
  Settings,
  Database,
  Box,
  ChevronDown,
  Server,
} from 'lucide-react';
import { getDrives, getWslDistros, getWslFilesystems } from '../api/system';
import type { WindowsDrive, WslDistro, WslMount } from '../api/system';

interface DriveEntry {
  id: string;
  name: string;
  letter: string;
  path: string;
  os: 'windows' | 'wsl';
  totalGB: number;
  usedGB: number;
  freeGB: number;
  percent: number;
  type: 'system' | 'data' | 'wsl';
  description: string;
  health?: string;
}

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified: string;
  ext?: string;
  iconType?: 'doc' | 'image' | 'code' | 'config';
}

const fileBrowser: FileItem[] = [
  { name: '..', type: 'folder', modified: '' },
  { name: 'Hermes', type: 'folder', modified: '今天 14:32' },
  { name: 'projects', type: 'folder', modified: '昨天 09:15' },
  { name: 'Documents', type: 'folder', modified: '3天前' },
  { name: 'Downloads', type: 'folder', modified: '1周前' },
  { name: '.config', type: 'folder', modified: '今天 08:00' },
  { name: 'README.md', type: 'file', size: '4.2 KB', modified: '今天 12:00', ext: 'md', iconType: 'doc' },
  { name: 'package.json', type: 'file', size: '1.8 KB', modified: '今天 11:30', ext: 'json', iconType: 'config' },
  { name: 'screenshot.png', type: 'file', size: '856 KB', modified: '今天 10:15', ext: 'png', iconType: 'image' },
  { name: 'app.tsx', type: 'file', size: '12.3 KB', modified: '今天 09:45', ext: 'tsx', iconType: 'code' },
  { name: 'config.yaml', type: 'file', size: '2.1 KB', modified: '昨天 18:20', ext: 'yaml', iconType: 'config' },
];

const getFileIcon = (item: FileItem) => {
  if (item.type === 'folder') return Folder;
  switch (item.iconType) {
    case 'image': return ImageIcon;
    case 'code': return FileText;
    case 'config': return Settings;
    case 'doc': return FileText;
    default: return File;
  }
};

const getFileColor = (item: FileItem) => {
  if (item.type === 'folder') return '#00f0ff';
  switch (item.iconType) {
    case 'image': return '#39ff14';
    case 'code': return '#ffd700';
    case 'config': return '#ff2a6d';
    default: return '#9ca3af';
  }
};

const commonDirs: { path: string; desc: string; icon: React.ElementType }[] = [
  { path: '/home/hermes-kabuto', desc: '用户主目录', icon: Home },
  { path: '/home/hermes-kabuto/Documents', desc: '文档', icon: FileText },
  { path: '/home/hermes-kabuto/Downloads', desc: '下载', icon: Folder },
  { path: '/home/hermes-kabuto/Projects', desc: '项目', icon: Box },
  { path: '/home/hermes-kabuto/.config', desc: '配置', icon: Settings },
  { path: '/home/hermes-kabuto/.local', desc: '用户程序', icon: Box },
  { path: '/etc', desc: '系统配置', icon: Settings },
  { path: '/var/log', desc: '日志', icon: Database },
];

const driveTypeColor: Record<string, string> = {
  system: '#ff2a6d',
  data: '#00f0ff',
  wsl: '#ffd700',
};

const driveTypeLabel: Record<string, string> = {
  system: '系统',
  data: '数据',
  wsl: 'WSL',
};

function buildDriveEntries(drives: WindowsDrive[], mounts: WslMount[]): DriveEntry[] {
  const entries: DriveEntry[] = [];

  for (const d of drives) {
    const pct = d.TotalGB > 0 ? Math.round(d.UsedGB / d.TotalGB * 100) : 0;
    entries.push({
      id: d.Letter.replace(':', '').toLowerCase(),
      name: d.Label || `${d.Letter} 盘`,
      letter: d.Letter,
      path: `/mnt/${d.Letter.replace(':', '').toLowerCase()}`,
      os: 'windows',
      totalGB: d.TotalGB,
      usedGB: d.UsedGB,
      freeGB: d.FreeGB,
      percent: pct,
      type: d.Letter.startsWith('C') ? 'system' : 'data',
      description: d.Health === 'Healthy' ? '健康' : d.Health,
      health: d.Health,
    });
  }

  const rootMount = mounts.find(m => m.mount === '/' && m.filesystem.startsWith('/dev/'));
  if (rootMount) {
    const totalGB = Math.round(rootMount.size_bytes / 1073741824 * 10) / 10;
    const usedGB = Math.round(rootMount.used_bytes / 1073741824 * 10) / 10;
    entries.push({
      id: 'root',
      name: 'WSL 根目录',
      letter: '',
      path: '/',
      os: 'wsl',
      totalGB,
      usedGB,
      freeGB: Math.round(rootMount.avail_bytes / 1073741824 * 10) / 10,
      percent: rootMount.used_pct,
      type: 'wsl',
      description: `ext4 vhdx · ${rootMount.filesystem}`,
    });
  }

  return entries;
}

export default function DevicePage() {
  const [drives, setDrives] = useState<DriveEntry[]>([]);
  const [distros, setDistros] = useState<WslDistro[]>([]);
  const [mounts, setMounts] = useState<WslMount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<string>('root');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['drives', 'wsl', 'browser']));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, w, f] = await Promise.allSettled([getDrives(), getWslDistros(), getWslFilesystems()]);
      const driveData = d.status === 'fulfilled' ? d.value.drives : [];
      const distroData = w.status === 'fulfilled' ? w.value.distros : [];
      const mountData = f.status === 'fulfilled' ? f.value.mounts : [];

      setDrives(buildDriveEntries(driveData, mountData));
      setDistros(distroData);
      setMounts(mountData);

      if (d.status === 'rejected' && w.status === 'rejected' && f.status === 'rejected') {
        setError('无法连接系统服务');
      }
    } catch {
      setError('加载系统数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentDrive = drives.find((d) => d.id === selectedDrive);

  const formatGB = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部标题 ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <HardDrive size={16} color="#00f0ff" />
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
            此电脑
          </h1>
          <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}>
            WSL2 · {distros.find(d => d.state === 'Running')?.name ?? 'Ubuntu-22.04'}
          </span>
        </div>
        <motion.button
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px]"
          style={{
            background: 'rgba(0,240,255,0.08)',
            border: '1px solid rgba(0,240,255,0.2)',
            color: '#00f0ff',
          }}
          whileHover={{ background: 'rgba(0,240,255,0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </motion.button>
      </div>

      {/* ── 可滚动内容 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        {error && (
          <div
            className="rounded-lg border px-4 py-2 text-[11px]"
            style={{ background: 'rgba(255,42,109,0.08)', borderColor: 'rgba(255,42,109,0.3)', color: '#ff2a6d' }}
          >
            {error}
          </div>
        )}

        {/* ── 设备与驱动器 ── */}
        <Section
          title="设备与驱动器"
          icon={HardDrive}
          iconColor="#00f0ff"
          expanded={expandedSections.has('drives')}
          onToggle={() => toggleSection('drives')}
          count={drives.length}
        >
          <div className="grid grid-cols-3 gap-3">
            {drives.map((drive, idx) => (
              <motion.button
                key={drive.id}
                className="text-left rounded-lg border p-3 relative overflow-hidden"
                style={{
                  borderColor: selectedDrive === drive.id ? `${driveTypeColor[drive.type]}50` : 'rgba(0,240,255,0.1)',
                  background: selectedDrive === drive.id ? `${driveTypeColor[drive.type]}08` : 'rgba(0,0,0,0.3)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                whileHover={{
                  borderColor: `${driveTypeColor[drive.type]}50`,
                  boxShadow: `0 0 12px ${driveTypeColor[drive.type]}20`,
                } as const}
                onClick={() => setSelectedDrive(drive.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${driveTypeColor[drive.type]}15`,
                      border: `1px solid ${driveTypeColor[drive.type]}30`,
                    }}
                  >
                    <HardDrive size={18} color={driveTypeColor[drive.type]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[12px] font-bold truncate" style={{ color: '#e0e0e0' }}>
                        {drive.name}
                      </h3>
                      <span
                        className="text-[8px] px-1 rounded flex-shrink-0"
                        style={{ background: `${driveTypeColor[drive.type]}20`, color: driveTypeColor[drive.type] }}
                      >
                        {driveTypeLabel[drive.type]}
                      </span>
                      {drive.health && drive.health !== 'Healthy' && (
                        <span className="text-[8px] px-1 rounded flex-shrink-0" style={{ background: 'rgba(255,42,109,0.2)', color: '#ff2a6d' }}>
                          {drive.health}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] mt-0.5 truncate font-mono" style={{ color: '#666' }}>
                      {drive.letter || drive.path}
                    </p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: '#9ca3af' }}>
                      {drive.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px] mb-1" style={{ color: '#666' }}>
                    <span>{formatGB(drive.usedGB)} / {formatGB(drive.totalGB)}</span>
                    <span style={{ color: drive.percent > 80 ? '#ff2a6d' : drive.percent > 60 ? '#ffd700' : '#39ff14' }}>
                      {drive.percent}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: drive.percent > 80
                          ? 'linear-gradient(90deg, #ff2a6d, #ff8800)'
                          : drive.percent > 60
                          ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
                          : 'linear-gradient(90deg, #39ff14, #00f0ff)',
                        boxShadow: `0 0 6px ${drive.percent > 80 ? '#ff2a6d' : drive.percent > 60 ? '#ffd700' : '#39ff14'}88`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${drive.percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' as const }}
                    />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </Section>

        {/* ── WSL2 发行版 ── */}
        <Section
          title="WSL2 发行版"
          icon={Server}
          iconColor="#ffd700"
          expanded={expandedSections.has('wsl')}
          onToggle={() => toggleSection('wsl')}
          count={distros.length}
          highlight
        >
          <div className="grid grid-cols-2 gap-3">
            {distros.map((distro, idx) => {
              const isRunning = distro.state === 'Running';
              return (
                <motion.div
                  key={distro.name}
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: isRunning ? 'rgba(255,215,0,0.3)' : 'rgba(255,215,0,0.1)',
                    background: isRunning ? 'rgba(255,215,0,0.04)' : 'rgba(0,0,0,0.2)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgba(255,215,0,0.1)',
                        border: '1px solid rgba(255,215,0,0.3)',
                      }}
                    >
                      <Terminal size={18} color="#ffd700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[12px] font-bold" style={{ color: '#e0e0e0' }}>
                          {distro.name}
                        </h3>
                        {distro.is_default && (
                          <span className="text-[8px] px-1 rounded" style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff' }}>
                            默认
                          </span>
                        )}
                      </div>
                      <p className="text-[10px]" style={{ color: '#666' }}>WSL {distro.version}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: isRunning ? '#39ff14' : '#666',
                          boxShadow: isRunning ? '0 0 4px #39ff14' : 'none',
                          animation: isRunning ? 'breathe 2s ease-in-out infinite' : undefined,
                        }}
                      />
                      <span className="text-[10px]" style={{ color: isRunning ? '#39ff14' : '#666' }}>
                        {isRunning ? '运行中' : '已停止'}
                      </span>
                    </div>
                    <code className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: '#9ca3af' }}>
                      \\wsl$\{distro.name}
                    </code>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* ── WSL 文件系统 ── */}
        {mounts.filter(m => m.filesystem.startsWith('/dev/') || m.mount === '/mnt/c').length > 0 && (
          <Section
            title="WSL 文件系统挂载"
            icon={Database}
            iconColor="#39ff14"
            expanded={expandedSections.has('mounts')}
            onToggle={() => toggleSection('mounts')}
            count={mounts.filter(m => m.filesystem.startsWith('/dev/') || m.mount === '/mnt/c').length}
          >
            <div className="space-y-2">
              {mounts
                .filter(m => m.filesystem.startsWith('/dev/') || m.mount === '/mnt/c')
                .map((m) => {
                  const totalGB = Math.round(m.size_bytes / 1073741824 * 10) / 10;
                  const usedGB = Math.round(m.used_bytes / 1073741824 * 10) / 10;
                  return (
                    <div
                      key={m.mount}
                      className="flex items-center gap-3 rounded-md border px-3 py-2"
                      style={{ borderColor: 'rgba(57,255,20,0.1)', background: 'rgba(0,0,0,0.2)' }}
                    >
                      <Database size={12} color="#39ff14" />
                      <code className="text-[10px] flex-1 truncate" style={{ color: '#e0e0e0' }}>{m.mount}</code>
                      <span className="text-[9px]" style={{ color: '#666' }}>{formatGB(usedGB)} / {formatGB(totalGB)}</span>
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.used_pct}%`,
                            background: m.used_pct > 80
                              ? 'linear-gradient(90deg, #ff2a6d, #ff8800)'
                              : 'linear-gradient(90deg, #39ff14, #00f0ff)',
                          }}
                        />
                      </div>
                      <span className="text-[9px] w-8 text-right" style={{ color: m.used_pct > 80 ? '#ff2a6d' : '#39ff14' }}>
                        {m.used_pct}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </Section>
        )}

        {/* ── 文件浏览 ── */}
        <Section
          title={currentDrive ? `文件浏览 · ${currentDrive.path}` : '文件浏览'}
          icon={Folder}
          iconColor="#39ff14"
          expanded={expandedSections.has('browser')}
          onToggle={() => toggleSection('browser')}
        >
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
          >
            <div
              className="flex items-center gap-1.5 px-3 py-2 border-b text-[10px]"
              style={{ borderColor: 'rgba(0,240,255,0.08)', color: '#9ca3af' }}
            >
              <Home size={10} color="#666" />
              <ChevronRight size={10} color="#444" />
              <span>home</span>
              <ChevronRight size={10} color="#444" />
              <span>hermes-kabuto</span>
              <ChevronRight size={10} color="#444" />
              <span style={{ color: '#00f0ff' }}>~</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(0,240,255,0.05)' }}>
              {fileBrowser.map((file, idx) => {
                const Icon = getFileIcon(file);
                const color = getFileColor(file);
                return (
                  <motion.div
                    key={file.name}
                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/3 cursor-pointer text-[11px]"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                  >
                    <Icon size={12} color={color} />
                    <span className="flex-1 truncate" style={{ color: file.name === '..' ? '#666' : '#e0e0e0' }}>
                      {file.name}
                    </span>
                    {file.ext && (
                      <span
                        className="text-[9px] px-1 rounded font-mono"
                        style={{ background: `${color}15`, color }}
                      >
                        {file.ext}
                      </span>
                    )}
                    {file.size && (
                      <span className="text-[9px] w-16 text-right" style={{ color: '#666' }}>{file.size}</span>
                    )}
                    <span className="text-[9px] w-20 text-right" style={{ color: '#666' }}>{file.modified}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── 常用目录 ── */}
        <Section
          title="常用目录"
          icon={FolderOpen}
          iconColor="#9ca3af"
          expanded={expandedSections.has('common')}
          onToggle={() => toggleSection('common')}
        >
          <div className="grid grid-cols-4 gap-2">
            {commonDirs.map((dir, idx) => {
              const Icon = dir.icon;
              return (
                <motion.button
                  key={dir.path}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left border"
                  style={{
                    borderColor: 'rgba(0,240,255,0.08)',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  whileHover={{ borderColor: 'rgba(0,240,255,0.25)' }}
                >
                  <Icon size={12} color="#9ca3af" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium" style={{ color: '#e0e0e0' }}>{dir.desc}</p>
                    <p className="text-[9px] truncate font-mono" style={{ color: '#666' }}>{dir.path}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  iconColor,
  expanded,
  onToggle,
  count,
  highlight,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: highlight ? 'rgba(255,215,0,0.15)' : 'rgba(0,240,255,0.1)',
        background: highlight ? 'rgba(255,215,0,0.02)' : 'transparent',
      }}
    >
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/3 transition-colors"
        onClick={onToggle}
      >
        <ChevronDown
          size={12}
          style={{
            color: '#666',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
          }}
        />
        <Icon size={13} color={iconColor} />
        <span className="text-[11px] font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>
            {count}
          </span>
        )}
        {highlight && (
          <span className="text-[9px] px-1.5 py-0.5 rounded ml-auto" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}>
            核心
          </span>
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
