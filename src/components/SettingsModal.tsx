/** ============================================================
 *  SettingsModal — 设置弹窗（Marvis 风格）
 *  左侧分类导航 + 右侧具体设置
 *  赛博宫廷风格
 *  ============================================================ */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Settings, Brain, Bot, Database, Shield, Globe, Info,
  LogOut, Moon, Languages, Power, Key, Thermometer,
  Cpu, Eye, Zap, RefreshCw, HardDrive, FolderOpen, Lock,
  FileLock, Webhook, Timer, Mail,
  Check, ChevronRight, Sparkles, Activity, FileText,
} from 'lucide-react';

type SettingsSection = 'account' | 'general' | 'ai' | 'agent' | 'storage' | 'security' | 'network' | 'about';

interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

const navItems: SettingsNavItem[] = [
  { id: 'account', label: '我的账号', icon: User },
  { id: 'general', label: '通用设置', icon: Settings },
  { id: 'ai', label: 'AI 模型', icon: Brain },
  { id: 'agent', label: 'Agent 配置', icon: Bot },
  { id: 'storage', label: '存储与知识库', icon: Database },
  { id: 'security', label: '安全与隐私', icon: Shield },
  { id: 'network', label: '网络与代理', icon: Globe },
  { id: 'about', label: '关于', icon: Info },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  /* ESC 关闭 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="flex rounded-2xl overflow-hidden"
            style={{
              width: 'min(820px, 90vw)',
              height: 'min(600px, 80vh)',
              background: 'rgba(10, 10, 15, 0.96)',
              border: '1px solid rgba(0,240,255,0.2)',
              boxShadow: '0 0 60px rgba(0,240,255,0.1), 0 0 100px rgba(0,0,0,0.5)',
            }}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── 左侧导航栏 ── */}
            <div
              className="w-52 flex-shrink-0 flex flex-col border-r"
              style={{
                borderColor: 'rgba(0,240,255,0.08)',
                background: 'rgba(0,0,0,0.4)',
              }}
            >
              {/* 标题 */}
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <h2 className="text-sm font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
                  设置
                </h2>
              </div>

              {/* 导航项 */}
              <nav className="flex-1 overflow-y-auto py-2">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="relative w-full flex items-center gap-2.5 px-5 py-2.5 text-[12px] transition-colors text-left"
                      style={{
                        background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
                        color: isActive ? '#00f0ff' : '#9ca3af',
                      }}
                      onClick={() => setActiveSection(item.id)}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#e0e0e0';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#9ca3af';
                      }}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                          style={{ background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }}
                          layoutId="settings-nav-indicator"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* 底部版本 */}
              <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <p className="text-[9px]" style={{ color: '#666' }}>Hermes Marvis</p>
                <p className="text-[9px]" style={{ color: '#444' }}>v1.0.0 · build 20260607</p>
              </div>
            </div>

            {/* ── 右侧内容区 ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 顶部标题栏 */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(0,240,255,0.08)' }}
              >
                <h3 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                  {navItems.find((i) => i.id === activeSection)?.label}
                </h3>
                <motion.button
                  className="flex items-center justify-center w-7 h-7 rounded"
                  style={{ background: 'rgba(0,240,255,0.05)' }}
                  whileHover={{ background: 'rgba(0,240,255,0.15)', rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  onClick={onClose}
                  title="关闭"
                >
                  <X size={14} color="#9ca3af" />
                </motion.button>
              </div>

              {/* 设置内容 */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeSection === 'account' && <AccountSection />}
                    {activeSection === 'general' && <GeneralSection />}
                    {activeSection === 'ai' && <AISection />}
                    {activeSection === 'agent' && <AgentSection />}
                    {activeSection === 'storage' && <StorageSection />}
                    {activeSection === 'security' && <SecuritySection />}
                    {activeSection === 'network' && <NetworkSection />}
                    {activeSection === 'about' && <AboutSection />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   各个设置分区
   ═══════════════════════════════════════════════════════════════ */

/* ── 我的账号 ── */
function AccountSection() {
  return (
    <div className="flex flex-col items-center pt-4">
      <motion.div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3"
        style={{
          background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(255,215,0,0.15))',
          border: '1px solid rgba(0,240,255,0.3)',
          boxShadow: '0 0 20px rgba(0,240,255,0.15)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <span className="text-2xl font-black" style={{ color: '#00f0ff' }}>H</span>
      </motion.div>
      <h3 className="text-base font-bold" style={{ color: '#e0e0e0' }}>Hermes</h3>
      <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>leonvo@hermes.ai</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className="text-[9px] px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}
        >
          赛博宫廷首辅
        </span>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(57,255,20,0.15)', color: '#39ff14' }}
        >
          L1
        </span>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-sm">
        <StatBox label="运行天数" value="42" />
        <StatBox label="对话次数" value="1.2K" />
        <StatBox label="完成任务" value="328" />
      </div>

      {/* 操作按钮 */}
      <div className="mt-6 w-full max-w-sm space-y-2">
        <ActionButton icon={Mail} label="更换邮箱" desc="修改登录邮箱" />
        <ActionButton icon={Key} label="修改密码" desc="更新账户密码" />
        <motion.button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px]"
          style={{
            background: 'rgba(255,42,109,0.08)',
            border: '1px solid rgba(255,42,109,0.2)',
            color: '#ff2a6d',
          }}
          whileHover={{ background: 'rgba(255,42,109,0.15)' }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={13} />
          退出登录
        </motion.button>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-center border"
      style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
    >
      <p className="text-base font-black" style={{ color: '#00f0ff' }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: '#666' }}>{label}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc: string; children?: React.ReactNode }) {
  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.1)' }}
      whileHover={{ borderColor: 'rgba(0,240,255,0.3)' }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon size={14} color="#00f0ff" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px]" style={{ color: '#e0e0e0' }}>{label}</p>
        <p className="text-[10px]" style={{ color: '#666' }}>{desc}</p>
      </div>
      {children}
      <ChevronRight size={12} color="#666" />
    </motion.button>
  );
}

/* ── 通用设置 ── */
function GeneralSection() {
  return (
    <div className="space-y-3">
      <SettingRow icon={Moon} label="主题" desc="界面外观模式">
        <Toggle checked={true} label="深色" />
      </SettingRow>
      <SettingRow icon={Languages} label="语言" desc="界面显示语言">
        <Select options={['简体中文', 'English']} defaultValue="简体中文" />
      </SettingRow>
      <SettingRow icon={Power} label="开机自启" desc="系统启动时自动运行">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={Sparkles} label="启动动画" desc="开机星辰归位仪式">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={RefreshCw} label="自动更新" desc="新版本自动下载">
        <Toggle checked={false} />
      </SettingRow>
    </div>
  );
}

/* ── AI 模型 ── */
function AISection() {
  return (
    <div className="space-y-3">
      <div
        className="rounded-lg p-3 border"
        style={{ borderColor: 'rgba(255,215,0,0.2)', background: 'rgba(255,215,0,0.04)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={12} color="#ffd700" />
          <span className="text-[11px] font-bold" style={{ color: '#ffd700' }}>核心配置</span>
        </div>
        <p className="text-[10px]" style={{ color: '#9ca3af' }}>
          AI 模型配置影响所有 Agent 的回复质量与成本，请谨慎调整。
        </p>
      </div>

      <SettingRow icon={Brain} label="调度模型" desc="首辅 Agent 使用">
        <Select options={['GPT-4o', 'Claude 3.5 Sonnet', 'DeepSeek-V3', 'Qwen2.5-Max']} defaultValue="GPT-4o" />
      </SettingRow>
      <SettingRow icon={Cpu} label="嵌入模型" desc="知识库向量化">
        <Select options={['text-embedding-3-small', 'BGE-M3', 'M3E-Large']} defaultValue="BGE-M3" />
      </SettingRow>
      <SettingRow icon={Thermometer} label="Temperature" desc="回复创造性 (0-1)">
        <Slider min={0} max={1} step={0.1} defaultValue={0.7} />
      </SettingRow>
      <SettingRow icon={Eye} label="上下文长度" desc="单次对话最大 Token">
        <Select options={['8K', '16K', '32K', '64K', '128K']} defaultValue="32K" />
      </SettingRow>
      <SettingRow icon={Key} label="API Key" desc="模型服务密钥">
        <code className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: '#9ca3af' }}>
          sk-•••••••••••••••••••••M3
        </code>
      </SettingRow>
    </div>
  );
}

/* ── Agent 配置 ── */
function AgentSection() {
  return (
    <div className="space-y-3">
      <SettingRow icon={Zap} label="最大并发" desc="同时运行 Agent 数">
        <Select options={['4', '8', '16', '32']} defaultValue="8" />
      </SettingRow>
      <SettingRow icon={Shield} label="熔断阈值" desc="连续失败自动隔离">
        <Select options={['3 次', '5 次', '10 次', '永不熔断']} defaultValue="3 次" />
      </SettingRow>
      <SettingRow icon={Timer} label="心跳间隔" desc="健康检查频率">
        <Select options={['15s', '30s', '60s', '120s']} defaultValue="30s" />
      </SettingRow>
      <SettingRow icon={Activity} label="自动恢复" desc="故障 Agent 自动重启">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={HardDrive} label="记忆持久化" desc="会话记忆自动保存">
        <Toggle checked={true} />
      </SettingRow>
    </div>
  );
}

/* ── 存储与知识库 ── */
function StorageSection() {
  return (
    <div className="space-y-3">
      <SettingRow icon={Database} label="向量数据库" desc="RAG 检索后端">
        <Select options={['Milvus (本地)', 'Pinecone (云端)', 'Qdrant (本地)']} defaultValue="Milvus (本地)" />
      </SettingRow>
      <SettingRow icon={FolderOpen} label="Obsidian 路径" desc="本地知识库目录">
        <code className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: '#00f0ff' }}>
          /home/leonvo/Documents/Obsidian
        </code>
      </SettingRow>
      <SettingRow icon={Zap} label="LLM Wiki 同步" desc="实时增量更新">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={RefreshCw} label="同步频率" desc="自动同步间隔">
        <Select options={['实时', '5 分钟', '30 分钟', '1 小时']} defaultValue="实时" />
      </SettingRow>
      <SettingRow icon={HardDrive} label="存储清理" desc="清理过期临时数据">
        <motion.button
          className="px-3 py-1 rounded text-[10px]"
          style={{
            background: 'rgba(255,42,109,0.1)',
            border: '1px solid rgba(255,42,109,0.2)',
            color: '#ff2a6d',
          }}
          whileHover={{ background: 'rgba(255,42,109,0.2)' }}
        >
          立即清理
        </motion.button>
      </SettingRow>
    </div>
  );
}

/* ── 安全与隐私 ── */
function SecuritySection() {
  return (
    <div className="space-y-3">
      <SettingRow icon={FileLock} label="输入过滤" desc="敏感内容自动拦截">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={Shield} label="注入防御" desc="Prompt 越狱检测">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={Lock} label="本地加密" desc="敏感数据 AES-256">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={Eye} label="审计日志" desc="操作全链路记录">
        <Select options={['关闭', '仅错误', '全部']} defaultValue="仅错误" />
      </SettingRow>
      <SettingRow icon={Timer} label="数据保留" desc="日志保留时长">
        <Select options={['7 天', '30 天', '90 天', '永久']} defaultValue="30 天" />
      </SettingRow>
    </div>
  );
}

/* ── 网络与代理 ── */
function NetworkSection() {
  return (
    <div className="space-y-3">
      <SettingRow icon={Globe} label="API 代理" desc="HTTP/HTTPS 代理">
        <code className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: '#666' }}>
          未配置
        </code>
      </SettingRow>
      <SettingRow icon={Webhook} label="Webhook 签名" desc="HMAC-SHA256 验证">
        <Toggle checked={true} />
      </SettingRow>
      <SettingRow icon={Timer} label="请求超时" desc="API 调用最长等待">
        <Select options={['15s', '30s', '60s', '120s']} defaultValue="60s" />
      </SettingRow>
      <SettingRow icon={Zap} label="速率限制" desc="单用户最大并发">
        <Select options={['5', '10', '20', '无限制']} defaultValue="10" />
      </SettingRow>
    </div>
  );
}

/* ── 关于 ── */
function AboutSection() {
  return (
    <div className="space-y-4">
      {/* Logo + 版本 */}
      <div className="flex flex-col items-center pt-2">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(255,215,0,0.15))',
            border: '1px solid rgba(0,240,255,0.3)',
          }}
        >
          <span className="text-xl font-black" style={{ color: '#00f0ff' }}>H</span>
        </div>
        <h3 className="text-base font-bold" style={{ color: '#e0e0e0' }}>Hermes Marvis</h3>
        <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>v1.0.0 · build 20260607</p>
      </div>

      <div className="space-y-2">
        <ActionButton icon={Bot} label="GitHub 仓库" desc="anomalyco/hermes-marvis" />
        <ActionButton icon={Mail} label="联系支持" desc="support@hermes.ai" />
        <ActionButton icon={FileText} label="更新日志" desc="查看最新版本说明" />
        <ActionButton icon={FileText} label="使用文档" desc="快速上手指南" />
        <ActionButton icon={Sparkles} label="检查更新" desc="当前已是最新版本">
          <Check size={12} color="#39ff14" />
        </ActionButton>
      </div>

      <p className="text-[9px] text-center mt-4" style={{ color: '#444' }}>
        © 2026 Hermes Team · MIT License
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   通用设置 UI 组件
   ═══════════════════════════════════════════════════════════════ */

function SettingRow({
  icon: Icon,
  label,
  desc,
  children,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.08)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(0,240,255,0.08)' }}
      >
        <Icon size={14} color="#00f0ff" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium" style={{ color: '#e0e0e0' }}>{label}</p>
        <p className="text-[10px]" style={{ color: '#666' }}>{desc}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, label }: { checked: boolean; label?: string }) {
  const [isChecked, setIsChecked] = useState(checked);
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px]" style={{ color: '#9ca3af' }}>{label}</span>}
      <button
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{
          background: isChecked ? 'rgba(0,240,255,0.3)' : 'rgba(0,0,0,0.5)',
          border: `1px solid ${isChecked ? '#00f0ff' : 'rgba(255,255,255,0.1)'}`,
        }}
        onClick={() => setIsChecked(!isChecked)}
      >
        <motion.div
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
          style={{
            background: isChecked ? '#00f0ff' : '#666',
            boxShadow: isChecked ? '0 0 6px #00f0ff' : 'none',
          }}
          animate={{ left: isChecked ? '18px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function Select({ options, defaultValue }: { options: string[]; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <select
      className="px-2 py-1 rounded text-[10px] outline-none cursor-pointer"
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(0,240,255,0.2)',
        color: '#00f0ff',
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: '#0a0a0f' }}>{o}</option>
      ))}
    </select>
  );
}

function Slider({ min, max, step, defaultValue }: { min: number; max: number; step: number; defaultValue: number }) {
  const [value, setValue] = useState(defaultValue);
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 relative h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #00f0ff, #0099cc)',
            boxShadow: '0 0 4px #00f0ff',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 w-2.5 h-2.5 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            left: `${percent}%`,
            background: '#00f0ff',
            boxShadow: '0 0 6px #00f0ff',
          }}
        />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color: '#00f0ff' }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}
