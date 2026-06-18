/** ============================================================
 *  App.tsx — Hermes 赛博宫廷办公室主入口
 *  三栏布局：左侧导航 + 中间工位 + 右侧概览
 *  ============================================================ */

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Agent } from './data';
import { agents as initialAgents } from './data';
import { useAgentStatus } from './hooks/useAgentStatus';
import { useAgentMemory } from './hooks/useAgentMemory';
import CyberPalaceBackground from './components/CyberPalaceBackground';
import StarEntryRitual from './components/StarEntryRitual';
import DeskStation from './components/DeskStation';
import LeftNav from './components/LeftNav';
import RightOverview from './components/RightOverview';
import ScrollDetailModal from './components/ScrollDetailModal';
import NewChatPage from './components/NewChatPage';
import AutoTaskPage from './components/AutoTaskPage';
import SkillsPage from './components/SkillsPage';
import KnowledgePage from './components/KnowledgePage';
import AssetsPage from './components/AssetsPage';
import DevicePage from './components/DevicePage';
import SettingsModal from './components/SettingsModal';
import ChatListPage from './components/ChatListPage';

export default function App() {
  const [agents] = useState<Agent[]>(initialAgents);
  const { statuses } = useAgentStatus(agents);
  const { memories } = useAgentMemory();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryDone, setEntryDone] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeNavId, setActiveNavId] = useState('workspace');
  const [showSettings, setShowSettings] = useState(false);

  /* 响应式检测 */
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1280);
      setIsMobile(w < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* 切换左侧侧边栏 */
  const handleToggleLeft = useCallback(() => {
    setLeftCollapsed((prev) => !prev);
  }, []);

  /* 切换右侧侧边栏 */
  const handleToggleRight = useCallback(() => {
    setRightCollapsed((prev) => !prev);
  }, []);

  /* 导航切换 */
  const handleNavChange = useCallback((id: string) => {
    setActiveNavId(id);
  }, []);

  /* 打开详情 */
  const handleOpenAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  }, []);

  /* 关闭详情 */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAgent(null), 400);
  }, []);

  /* 入场完成 */
  const handleEntryComplete = useCallback(() => {
    setEntryDone(true);
  }, []);

  /* 获取 Agent 实时状态 */
  const getAgentStatus = useCallback(
    (agentId: string) => {
      const s = statuses.find((st) => st.id === agentId);
      return s?.status || 'online';
    },
    [statuses],
  );

  /* 获取带实时状态的 agents 列表 */
  const agentsWithStatus = agents.map((agent) => ({
    ...agent,
    status: getAgentStatus(agent.id),
  }));

  /* ── 渲染 ── */
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* 背景层 z-0 */}
      <CyberPalaceBackground />

      {/* 入场仪式 */}
      {!entryDone && <StarEntryRitual agents={agents} onComplete={handleEntryComplete} />}

      {/* ── 移动端简化列表 ── */}
      {isMobile && entryDone && (
        <motion.div
          className="flex-1 z-10 overflow-y-auto px-4 py-20 pb-6 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-3">
            {agentsWithStatus.map((agent) => {
              const statusColor = {
                online: '#00f0ff',
                busy: '#ffd700',
                slacking: '#39ff14',
                offline: '#666',
              }[agent.status];
              return (
                <motion.div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 border cursor-pointer"
                  style={{
                    borderColor: agent.department === '首辅' ? 'rgba(255,215,0,0.3)' : 'rgba(0,240,255,0.15)',
                    background: 'rgba(10,10,15,0.8)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenAgent(agent)}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                        {agent.name}
                      </span>
                      {agent.department === '首辅' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: '#ffd700', color: '#ffd700' }}>
                          首辅
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] truncate" style={{ color: '#9ca3af' }}>
                      {agent.title}
                    </p>
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded" style={{ color: statusColor, background: `${statusColor}11` }}>
                    {agent.status === 'online' ? '在线' : agent.status === 'busy' ? '忙碌' : agent.status === 'slacking' ? '摸鱼' : '离线'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── 桌面/平板 三栏布局 ── */}
      {!isMobile && (
        <div className="flex-1 flex min-h-0">
          {/* 左侧导航栏 */}
          <LeftNav
            entryDone={entryDone}
            collapsed={leftCollapsed}
            onToggle={handleToggleLeft}
            activeId={activeNavId}
            onNavChange={handleNavChange}
            onOpenSettings={() => setShowSettings(true)}
          />

          {/* 中间核心区域 */}
          <div className="flex-1 flex flex-col relative z-10 min-w-0">
            {activeNavId === 'new' ? (
              <NewChatPage />
            ) : activeNavId === 'task' ? (
              <AutoTaskPage />
            ) : activeNavId === 'skills' ? (
              <SkillsPage />
            ) : activeNavId === 'knowledge' ? (
              <KnowledgePage />
            ) : activeNavId === 'assets' ? (
              <AssetsPage />
            ) : activeNavId === 'device' ? (
              <DevicePage />
            ) : activeNavId === 'chats' ? (
              <ChatListPage />
            ) : (
              <>
                {/* 顶部标题行 */}
                <motion.div
                  className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: entryDone ? 1 : 0, y: entryDone ? 0 : -10 }}
                  transition={{ delay: 3, duration: 0.6 }}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h1 className="text-lg font-black tracking-wider" style={{ color: '#e0e0e0' }}>
                        赛博宫廷
                      </h1>
                      <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
                        九部 Agent 协同办公
                      </p>
                    </div>
          {/* 团队成员头像行 */}
          <div className="flex items-center gap-1 ml-4">
            {agentsWithStatus.slice(0, 5).map((agent, idx) => (
                        <motion.div
                          key={agent.id}
                          className="w-7 h-7 rounded-full border flex items-center justify-center text-[9px] font-bold cursor-pointer"
                          style={{
                            borderColor: agent.status === 'offline' ? '#444' : agent.avatar.glow,
                            background: agent.status === 'offline' ? 'rgba(100,100,100,0.2)' : `${agent.avatar.glow}22`,
                            color: agent.status === 'offline' ? '#666' : agent.avatar.glow,
                            marginLeft: idx > 0 ? -6 : 0,
                          }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: entryDone ? 1 : 0, scale: entryDone ? 1 : 0 }}
                          transition={{ delay: 3.2 + idx * 0.08, duration: 0.3 }}
                          whileHover={{ scale: 1.15, zIndex: 10 }}
                          onClick={() => handleOpenAgent(agent)}
                          title={agent.name}
                        >
                          {agent.name.charAt(0)}
                        </motion.div>
                      ))}
                      {agents.length > 5 && (
                        <div
                          className="w-7 h-7 rounded-full border flex items-center justify-center text-[9px] font-bold"
                          style={{
                            borderColor: 'rgba(0,240,255,0.2)',
                            background: 'rgba(0,240,255,0.08)',
                            color: '#9ca3af',
                            marginLeft: -6,
                          }}
                        >
                          +{agents.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右上角状态 */}
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: '#666' }}>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
                      <span style={{ color: '#00f0ff' }}>在线</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffd700', boxShadow: '0 0 4px #ffd700' }} />
                      <span style={{ color: '#ffd700' }}>Teaching</span>
                    </span>
                  </div>
                </motion.div>

                {/* 工位区域 */}
                <div className="flex-1 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      transform: isTablet ? 'scale(0.7)' : 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                    drag={isTablet}
                    dragConstraints={{
                      left: -300,
                      right: 300,
                      top: -200,
                      bottom: 200,
                    }}
                    dragElastic={0.1}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: entryDone ? 1 : 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    {agentsWithStatus.map((agent, index) => (
                      <DeskStation
                        key={agent.id}
                        agent={agent}
                        isShoufu={agent.department === '首辅'}
                        onClick={() => handleOpenAgent(agent)}
                        index={index}
                        entryDone={entryDone}
                      />
                    ))}
                  </motion.div>
                </div>
              </>
            )}
          </div>

          {/* 右侧今日概览 */}
          <RightOverview
            agents={agentsWithStatus}
            entryDone={entryDone}
            collapsed={rightCollapsed}
            onToggle={handleToggleRight}
          />
        </div>
      )}

      {/* 详情弹窗 */}
      <ScrollDetailModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        memories={memories}
      />

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* 底部状态栏 */}
      {!isMobile && (
        <motion.div
          className="flex-shrink-0 z-10 flex items-center justify-center px-4 py-1.5 text-[10px]"
          style={{
            color: '#666',
            borderTop: '1px solid rgba(0,240,255,0.06)',
            background: 'rgba(10,10,15,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: entryDone ? 1 : 0 }}
          transition={{ delay: 3.5, duration: 0.5 }}
        >
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ background: '#00f0ff' }} />
              在线 {agentsWithStatus.filter((a) => a.status === 'online').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ background: '#ffd700' }} />
              忙碌 {agentsWithStatus.filter((a) => a.status === 'busy').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ background: '#39ff14' }} />
              摸鱼 {agentsWithStatus.filter((a) => a.status === 'slacking').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ background: '#666' }} />
              离线 {agentsWithStatus.filter((a) => a.status === 'offline').length}
            </span>
            <span style={{ color: '#444' }}>|</span>
            <span>2026-06-07 | Hermes Marvis v1.0</span>
          </div>
        </motion.div>
      )}

      {/* 平板模式提示 */}
      {isTablet && entryDone && (
        <motion.div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded text-[10px]"
          style={{
            background: 'rgba(0,240,255,0.1)',
            border: '1px solid rgba(0,240,255,0.3)',
            color: '#00f0ff',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4 }}
        >
          平板模式：拖拽可移动视角
        </motion.div>
      )}
    </div>
  );
}
