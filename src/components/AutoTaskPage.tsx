/** ============================================================
 *  AutoTaskPage — 自动任务页面
 *  完整集成 Hermes Cron（通过 WSL Python 服务）
 *  弹窗样式参照 Hermes 官方 WebUI
 *  ============================================================ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, ChevronDown, Play, Pause, Trash2, Loader2,
  RefreshCw, Sparkles, TrendingUp, Globe, Clock, AlertCircle, Zap,
  Power,
} from 'lucide-react';
import {
  listCronJobs, createCronJob, pauseCronJob, resumeCronJob,
  runCronJob, deleteCronJob,
} from '../api/cron';
import type { CronJob } from '../api/cron';

type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron' | 'interval';
type DeliverTarget = 'local' | 'origin' | 'telegram' | 'slack' | 'feishu' | 'discord' | 'email' | 'wechat' | 'weixin' | 'wecom' | 'dingtalk';

const REPEAT_LABELS: Record<RepeatType, string> = {
  once: '单次',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  interval: '间隔执行',
  cron: 'Cron 表达式',
};

const DELIVER_LABELS: Record<DeliverTarget, string> = {
  local: '本地保存',
  origin: '返回创建处',
  telegram: 'Telegram',
  slack: 'Slack',
  feishu: '飞书',
  discord: 'Discord',
  email: '邮件',
  wechat: '微信',
  weixin: '微信',
  wecom: '企业微信',
  dingtalk: '钉钉',
};

const PRESET_TASKS = [
  {
    id: 'fortune',
    title: '今日运势',
    desc: '结合生日 2021-12-18 15:00 生成每日运势：整体好坏、宜做、避忌、幸运颜色等',
    prompt: '请根据用户的生日（2021年12月18日 15:00）生成今日（{date}）的每日运势简报，包含：\n1. 整体运势（评分 1-5 星 + 一句话总结）\n2. 今日宜做（3 条）\n3. 今日避忌（3 条）\n4. 专属幸运颜色、幸运数字、幸运方位\n5. 健康与情绪提示\n请用 Markdown 排版，言简意赅，控制在 200 字内。',
    icon: Sparkles,
    color: '#00f0ff',
  },
  {
    id: 'robot-stocks',
    title: '机器人概念板块日报',
    desc: '汇总机器人/人形机器人板块的涨跌、市值、PE、龙头个股走势，整理成报告',
    prompt: '帮我梳理一下今天的机器人/人形机器人概念板块行情：\n1. 板块整体涨跌（涨跌幅、成交额）\n2. 板块内市值 TOP 5 个股（最新价、涨跌幅、市值、PE）\n3. 今日龙头股梳理（涨跌幅 TOP 3 和跌停股）\n4. 板块资金流入流出情况\n5. 今日重要消息面（政策/订单/技术突破）\n整理成可读报告，控制在 500 字内。',
    icon: TrendingUp,
    color: '#ffd700',
  },
  {
    id: 'global-pulse',
    title: '地球脉动',
    desc: '告诉我这一刻地球上正在发生什么',
    prompt: '请汇总当下地球上正在发生的重要事件：\n1. 时事热点（3 条，简明扼要）\n2. 科技突破（1-2 条）\n3. 体育/娱乐焦点（1 条）\n4. 金融市场重要动态（A 股、港股、美股各一句话）\n输出 200 字以内的「地球脉动」简报。',
    icon: Globe,
    color: '#39ff14',
  },
  {
    id: 'health-check',
    title: '每日健康检查',
    desc: '检查 Hermes 各组件运行状态、磁盘空间、API 配额',
    prompt: '请做一次本地系统健康检查：\n1. 检查磁盘空间（/home, /mnt/c）\n2. 检查 Hermes API 服务是否在 8642 端口监听\n3. 统计今日的 Token 用量、最近 24h 的 API 调用次数\n4. 检查 cron jobs.json 中任务数量及下次执行时间\n5. 检查 Obsidian vault 文件总数\n6. 总结成「系统健康日报」，如有异常请用 ❗ 标出',
    icon: Zap,
    color: '#00f0ff',
  },
];

export default function AutoTaskPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listCronJobs();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法连接 Cron 服务');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'run' | 'delete') => {
    try {
      if (action === 'pause') await pauseCronJob(id);
      else if (action === 'resume') await resumeCronJob(id);
      else if (action === 'run') await runCronJob(id);
      else if (action === 'delete') {
        const ok = window.confirm('确认删除此任务？');
        if (!ok) return;
        await deleteCronJob(id);
      }
      await refresh();
    } catch (err) {
      window.alert(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部标题栏 ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Clock size={16} color="#00f0ff" />
          <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>自动任务</h1>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>
            {jobs.length} 个任务
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            className="flex items-center justify-center w-8 h-8 rounded-md"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.15)' }}
            whileHover={{ background: 'rgba(0,240,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={refresh}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} color="#00f0ff" />
          </motion.button>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]"
            style={{
              background: 'linear-gradient(135deg, #00f0ff22, #0099cc22)',
              border: '1px solid rgba(0,240,255,0.3)',
              color: '#00f0ff',
            }}
            whileHover={{ boxShadow: '0 0 12px rgba(0,240,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={12} />
            <span>新建</span>
          </motion.button>
        </div>
      </div>

      {/* ── 内容区 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4" style={{ background: 'rgba(255,42,109,0.1)', border: '1px solid rgba(255,42,109,0.3)' }}>
            <AlertCircle size={14} color="#ff2a6d" />
            <span className="text-[11px]" style={{ color: '#ff2a6d' }}>{error}</span>
          </div>
        )}

        {/* 已创建任务列表 */}
        {jobs.length > 0 && (
          <div className="space-y-2 mb-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onAction={handleAction} />
            ))}
          </div>
        )}

        {!loading && jobs.length === 0 && !error && <EmptyState onCreate={() => setShowCreate(true)} />}

        {/* 推荐任务 */}
        <div className="mt-4">
          <p className="text-[11px] mb-3 px-1" style={{ color: '#666' }}>推荐任务模板</p>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_TASKS.map((task, idx) => {
              const Icon = task.icon;
              return (
                <motion.button
                  key={task.id}
                  className="rounded-lg border p-3 text-left flex flex-col"
                  style={{ borderColor: 'rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ borderColor: `${task.color}50`, boxShadow: `0 0 12px ${task.color}15` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreate(true)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${task.color}15` }}>
                      <Icon size={12} color={task.color} />
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: '#e0e0e0' }}>{task.title}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed line-clamp-2 mb-2 flex-1" style={{ color: '#9ca3af' }}>{task.desc}</p>
                  <div className="flex justify-end">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${task.color}11`, color: task.color }}>使用模板</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 新建任务弹窗 ── */}
      <CreateJobModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={async () => {
          setShowCreate(false);
          await refresh();
        }}
      />
    </div>
  );
}

/* ── 任务卡片 ── */
function JobCard({ job, onAction }: { job: CronJob; onAction: (id: string, action: 'pause' | 'resume' | 'run' | 'delete') => void }) {
  const isPaused = job.state === 'paused' || !job.enabled;
  const statusColor = isPaused ? '#666' : job.last_status === 'error' ? '#ff2a6d' : '#39ff14';
  const nextRun = job.next_run_at ? new Date(job.next_run_at) : null;
  const lastRun = job.last_run_at ? new Date(job.last_run_at) : null;

  return (
    <motion.div
      className="rounded-lg border px-4 py-3"
      style={{ borderColor: 'rgba(0,240,255,0.15)', background: 'rgba(0,0,0,0.3)' }}
      layout
    >
      <div className="flex items-start gap-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold truncate" style={{ color: '#e0e0e0' }}>
              {job.name || job.prompt.slice(0, 30)}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                background: isPaused ? 'rgba(100,100,100,0.2)' : 'rgba(57,255,20,0.15)',
                color: isPaused ? '#666' : '#39ff14',
              }}
            >
              {isPaused ? '已暂停' : '运行中'}
            </span>
          </div>
          <p className="text-[10px] line-clamp-2 mb-2" style={{ color: '#9ca3af' }}>{job.prompt}</p>
          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: '#666' }}>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              <span className="font-mono">{job.schedule_display || job.schedule.expr}</span>
            </span>
            {nextRun && (
              <span>下次: {nextRun.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {lastRun && (
              <span>上次: {lastRun.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            )}
            <span>投递: {DELIVER_LABELS[job.deliver as DeliverTarget] || job.deliver}</span>
            {job.repeat.completed > 0 && <span>已完成 {job.repeat.completed} 次</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <IconButton
            onClick={() => onAction(job.id, 'run')}
            color="#00f0ff"
            title="立即执行"
          >
            <Play size={12} />
          </IconButton>
          <IconButton
            onClick={() => onAction(job.id, isPaused ? 'resume' : 'pause')}
            color={isPaused ? '#39ff14' : '#ffd700'}
            title={isPaused ? '恢复' : '暂停'}
          >
            {isPaused ? <Power size={12} /> : <Pause size={12} />}
          </IconButton>
          <IconButton
            onClick={() => onAction(job.id, 'delete')}
            color="#ff2a6d"
            title="删除"
          >
            <Trash2 size={12} />
          </IconButton>
        </div>
      </div>
    </motion.div>
  );
}

function IconButton({ children, onClick, color, title }: { children: React.ReactNode; onClick: () => void; color: string; title: string }) {
  return (
    <motion.button
      className="flex items-center justify-center w-7 h-7 rounded"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
      whileHover={{ background: `${color}25` }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
    >
      <span style={{ color }}>{children}</span>
    </motion.button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)' }}
      >
        <Clock size={22} color="#00f0ff" />
      </div>
      <h2 className="text-sm font-bold mb-2" style={{ color: '#e0e0e0' }}>开启你的第一个自动任务吧</h2>
      <p className="text-[11px] text-center max-w-md mb-4" style={{ color: '#666' }}>
        Tips：请保持电脑开机并运行 hermes gateway，否则任务不会执行
      </p>
      <motion.button
        className="flex items-center gap-2 px-5 py-2 rounded-full text-xs"
        style={{
          background: 'linear-gradient(135deg, #00f0ff, #0099cc)',
          color: '#fff',
          boxShadow: '0 0 20px rgba(0,240,255,0.2)',
        }}
        whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(0,240,255,0.3)' }}
        whileTap={{ scale: 0.97 }}
        onClick={onCreate}
      >
        <Plus size={14} />
        <span>新建自动任务</span>
      </motion.button>
    </div>
  );
}

/* ── 新建弹窗（参照 Hermes 官方 WebUI 样式） ── */
function CreateJobModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [interval, setInterval] = useState('1h');
  const [cronExpr, setCronExpr] = useState('0 9 * * *');
  const [deliver, setDeliver] = useState<DeliverTarget>('local');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setPrompt('');
      setRepeat('once');
      setDate('');
      setTime('');
      setInterval('1h');
      setCronExpr('0 9 * * *');
      setDeliver('local');
      setError(null);
    }
  }, [open]);

  const buildSchedule = (): string | null => {
    if (repeat === 'once') {
      if (!date || !time) return null;
      return `${date}T${time}:00`;
    }
    if (repeat === 'interval') return `every ${interval}`;
    if (repeat === 'daily') return cronExpr.replace('* * *', '* * *') || '0 9 * * *';
    if (repeat === 'weekly') return cronExpr;
    if (repeat === 'monthly') return cronExpr;
    if (repeat === 'cron') return cronExpr;
    return null;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('请填写任务名称');
      return;
    }
    if (name.length > 50) {
      setError('名称最多 50 字符');
      return;
    }
    if (!prompt.trim()) {
      setError('请填写任务要求说明');
      return;
    }
    if (prompt.length > 8000) {
      setError('要求说明最多 8000 字符');
      return;
    }
    const schedule = buildSchedule();
    if (!schedule) {
      setError('请完整填写执行时间');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createCronJob({ name, prompt, schedule, deliver });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(15,15,20,0.98)',
              border: '1px solid rgba(0,240,255,0.2)',
              boxShadow: '0 0 60px rgba(0,240,255,0.15)',
              maxHeight: '90vh',
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
              <h3 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>新建自动任务</h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
                <X size={16} color="#9ca3af" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <Field label="名称" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  placeholder="请输入任务名称"
                  className="w-full px-3 py-2.5 rounded-md text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0e0e0' }}
                />
                <div className="text-right text-[10px] mt-1" style={{ color: '#666' }}>{name.length}/50</div>
              </Field>

              <Field label="要求说明" required>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={8000}
                  rows={6}
                  placeholder="请详细描述任务要求，越具体执行效果越好"
                  className="w-full px-3 py-2.5 rounded-md text-xs outline-none resize-none leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0e0e0', minHeight: 140 }}
                />
                <div className="text-right text-[10px] mt-1" style={{ color: '#666' }}>{prompt.length}/8000</div>
              </Field>

              <Field label="执行时间" required>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={repeat}
                      onChange={(v) => setRepeat(v as RepeatType)}
                      options={Object.entries(REPEAT_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                    />
                    {repeat === 'once' && (
                      <>
                        <TextInput type="date" value={date} onChange={setDate} placeholder="选择日期" />
                        <TextInput type="time" value={time} onChange={setTime} placeholder="选择时间" />
                      </>
                    )}
                    {repeat === 'interval' && (
                      <div className="col-span-2">
                        <TextInput value={interval} onChange={setInterval} placeholder="如 30m, 2h, 1d" />
                      </div>
                    )}
                    {(repeat === 'daily' || repeat === 'weekly' || repeat === 'monthly' || repeat === 'cron') && (
                      <div className="col-span-2">
                        <TextInput
                          value={cronExpr}
                          onChange={setCronExpr}
                          placeholder="0 9 * * *"
                        />
                      </div>
                    )}
                  </div>
                  {repeat === 'cron' && (
                    <p className="text-[10px]" style={{ color: '#666' }}>
                      Cron 表达式：分 时 日 月 周（如 0 9 * * * = 每天 9:00）
                    </p>
                  )}
                </div>
              </Field>

              <Field label="输出投递">
                <Select
                  value={deliver}
                  onChange={(v) => setDeliver(v as DeliverTarget)}
                  options={Object.entries(DELIVER_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
              </Field>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'rgba(255,42,109,0.1)', border: '1px solid rgba(255,42,109,0.3)' }}>
                  <AlertCircle size={12} color="#ff2a6d" />
                  <span className="text-[11px]" style={{ color: '#ff2a6d' }}>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: 'rgba(0,240,255,0.1)' }}>
              <button
                className="px-5 py-2 rounded-md text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
                onClick={onClose}
                disabled={submitting}
              >
                取消
              </button>
              <motion.button
                className="flex items-center gap-1.5 px-5 py-2 rounded-md text-xs"
                style={{
                  background: '#fff',
                  color: '#000',
                  fontWeight: 700,
                  opacity: submitting ? 0.5 : 1,
                }}
                whileHover={!submitting ? { scale: 1.02 } : undefined}
                whileTap={!submitting ? { scale: 0.98 } : undefined}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                <span>确定</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: '#e0e0e0' }}>
        {label}
        {required && <span style={{ color: '#ff2a6d' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-md text-xs outline-none"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0e0e0' }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md text-xs outline-none appearance-none pr-8"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0e0e0' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0a0a0f' }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" color="#666" />
    </div>
  );
}
