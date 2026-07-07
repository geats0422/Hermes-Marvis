/** ============================================================
 *  RightOverview — 右侧今日概览面板（Marvis 风格）
 *  支持折叠/展开，折叠状态保持当前状态
 *  折叠按钮位于标题行内部右侧
 *  ============================================================ */

import { motion, AnimatePresence } from 'framer-motion';
import type { Agent } from '../data';
import { Activity, Users, Zap, Clock, TrendingUp, Award, PanelRightClose, PanelRightOpen, Wifi, WifiOff, Coins, Cpu } from 'lucide-react';
import { useHermesHealth } from '../hooks/useHermes';
import { useHermesStats } from '../hooks/useHermesStats';

interface RightOverviewProps {
  agents: Agent[];
  entryDone: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

export default function RightOverview({ agents, entryDone, collapsed, onToggle }: RightOverviewProps) {
  const { online, detailed } = useHermesHealth();
  const { stats } = useHermesStats();
  const onlineCount = agents.filter((a) => a.status === 'online').length;
  const busyCount = agents.filter((a) => a.status === 'busy').length;
  const offlineCount = agents.filter((a) => a.status === 'offline').length;

  /* 今日统计卡片 — 实时数据 */
  const statsCards = [
    {
      label: '在线 Agent',
      value: onlineCount,
      total: agents.length,
      icon: Users,
      color: '#00f0ff',
      bg: 'rgba(0,240,255,0.08)',
    },
    {
      label: '活跃会话',
      value: stats.activeSessions,
      total: stats.totalSessions,
      icon: Zap,
      color: '#ffd700',
      bg: 'rgba(255,215,0,0.08)',
    },
    {
      label: '今日消息',
      value: stats.todayMessages,
      suffix: '条',
      icon: TrendingUp,
      color: '#39ff14',
      bg: 'rgba(57,255,20,0.08)',
    },
    {
      label: 'Token 用量',
      value: ((stats.totalInputTokens + stats.totalOutputTokens) / 1000).toFixed(1),
      suffix: 'k',
      icon: Cpu,
      color: '#00f0ff',
      bg: 'rgba(0,240,255,0.08)',
    },
    {
      label: '预估费用',
      value: stats.totalCost.toFixed(4),
      suffix: '$',
      icon: Coins,
      color: '#ffd700',
      bg: 'rgba(255,215,0,0.08)',
    },
    {
      label: '工具调用',
      value: stats.totalToolCalls,
      suffix: '次',
      icon: Activity,
      color: '#39ff14',
      bg: 'rgba(57,255,20,0.08)',
    },
  ];

  /* 当前运行 — 最近活跃的会话 */
  const activeSessions = stats.sessions
    .filter((s) => s.last_active > Date.now() / 1000 - 3600)
    .sort((a, b) => b.last_active - a.last_active)
    .slice(0, 5);

  return (
    <motion.div
      className="flex flex-col h-full border-l flex-shrink-0 overflow-hidden"
      style={{
        width: collapsed ? 48 : 280,
        borderColor: 'rgba(0,240,255,0.08)',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ x: 280, opacity: 0 }}
      animate={{ x: entryDone ? 0 : 280, opacity: entryDone ? 1 : 0 }}
      transition={{ delay: 2.8, duration: 0.5, ease: 'easeOut' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="collapsed"
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 折叠状态：标题 + 展开按钮 */}
            <div className="flex flex-col items-center gap-3 px-2 py-4 border-b" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <Activity size={14} color="#ffd700" />
              <button
                className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                style={{
                  background: 'rgba(0,240,255,0.1)',
                  border: '1px solid rgba(0,240,255,0.3)',
                  color: '#00f0ff',
                }}
                onClick={onToggle}
                title="展开"
              >
                <PanelRightOpen size={12} />
              </button>
            </div>

            {/* 竖排文字 */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
              <div
                className="text-[10px] font-bold tracking-[0.3em]"
                style={{ color: '#ffd700', writingMode: 'vertical-rl', letterSpacing: '0.2em' }}
              >
                今日概览
              </div>
            </div>

            {/* 底部状态点 */}
            <div className="flex flex-col items-center gap-2 py-4 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} title={`在线 ${onlineCount}`} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#ffd700', boxShadow: '0 0 4px #ffd700' }} title={`忙碌 ${busyCount}`} />
              {offlineCount > 0 && (
                <div className="w-2 h-2 rounded-full" style={{ background: '#ff2a6d', boxShadow: '0 0 4px #ff2a6d' }} title={`离线 ${offlineCount}`} />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            className="flex flex-col h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 顶部标题栏 — 包含折叠按钮 */}
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold tracking-wider" style={{ color: '#ffd700' }}>
                    今日概览
                  </h2>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: '#666' }}>
                    <Activity size={10} />
                    <span>实时</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mr-3">
                  {online ? <Wifi size={12} color="#00f0ff" /> : <WifiOff size={12} color="#666" />}
                  <span className="text-[10px]" style={{ color: online ? '#00f0ff' : '#666' }}>
                    {online ? '已连接' : '未连接'}
                  </span>
                  {detailed && online && (
                    <span className="text-[9px] px-1 py-0.5 rounded" style={{
                      background: detailed.gateway_busy ? 'rgba(255,215,0,0.1)' : 'rgba(57,255,20,0.08)',
                      color: detailed.gateway_busy ? '#ffd700' : '#39ff14',
                    }}>
                      {detailed.gateway_busy ? '忙碌' : '空闲'}
                    </span>
                  )}
                </div>
                {/* 折叠按钮 — 标题行内部右侧，明显位置 */}
                <motion.button
                  className="flex items-center gap-1 px-2 py-1 rounded transition-colors text-[10px]"
                  style={{
                    background: 'rgba(0,240,255,0.08)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    color: '#00f0ff',
                  }}
                  onClick={onToggle}
                  title="折叠侧边栏"
                  whileHover={{ scale: 1.05, background: 'rgba(0,240,255,0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PanelRightClose size={12} />
                  <span>折叠</span>
                </motion.button>
              </div>
            </div>

            {/* 可滚动内容区 */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {/* 统计卡片 */}
              <div className="px-4 py-3 space-y-2">
                {statsCards.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      className="rounded-lg px-4 py-3 border"
                      style={{
                        borderColor: `${stat.color}22`,
                        background: stat.bg,
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.1, duration: 0.4 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={14} color={stat.color} />
                          <span className="text-[11px]" style={{ color: '#9ca3af' }}>
                            {stat.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-black" style={{ color: stat.color }}>
                          {stat.value}
                        </span>
                        {stat.total !== undefined && (
                          <span className="text-[10px]" style={{ color: '#666' }}>
                            / {stat.total}
                          </span>
                        )}
                        {stat.suffix && (
                          <span className="text-[10px]" style={{ color: '#666' }}>
                            {stat.suffix}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 运行状态 */}
              <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={12} color="#00f0ff" />
                  <span className="text-[11px] font-bold" style={{ color: '#00f0ff' }}>
                    当前运行
                  </span>
                </div>
                <div className="space-y-2">
                  {activeSessions.length === 0 ? (
                    <div className="text-[10px] py-2 text-center" style={{ color: '#666' }}>
                      暂无 Agent 执行任务
                    </div>
                  ) : (
                    activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-2 rounded px-3 py-2"
                        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.1)' }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#ffd700', boxShadow: '0 0 6px #ffd700' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate" style={{ color: '#e0e0e0' }}>
                            {session.title || '无标题'}
                          </p>
                          <p className="text-[9px] truncate" style={{ color: '#666' }}>
                            {session.message_count} 条消息 · {new Date(session.last_active * 1000).toLocaleTimeString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 底部状态 */}
              <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
                <div className="space-y-3">
                  {/* 系统等级 */}
                  <div className="flex items-center gap-2">
                    <Award size={14} color="#ffd700" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: '#9ca3af' }}>
                          系统等级
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: '#ffd700' }}>
                          L1
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,215,0,0.1)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: '35%',
                            background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
                            boxShadow: '0 0 6px rgba(255,215,0,0.3)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 当前状态 */}
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: '#666' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
                    <span>当前在线</span>
                    <span style={{ color: '#00f0ff' }}>•</span>
                    <span>{stats.activeSessions} 个活跃会话</span>
                  </div>

                  {/* 离线提示 */}
                  {offlineCount > 0 && (
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: '#ff2a6d' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff2a6d' }} />
                      <span>{offlineCount} 个 Agent 离线</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
