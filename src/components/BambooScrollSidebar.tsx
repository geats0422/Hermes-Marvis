/** ============================================================
 *  模块 4：BambooScrollSidebar — 电子奏折待办清单
 *  包含：竹简容器、朱批任务、朱砂印章动画
 *  ============================================================ */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, Todo } from '../data';
import { CheckCircle2, Circle } from 'lucide-react';

interface BambooScrollSidebarProps {
  todos: Todo[];
  agents: Agent[];
  onToggleTodo: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function BambooScrollSidebar({
  todos,
  agents,
  onToggleTodo,
  collapsed = false,
  onToggleCollapse,
}: BambooScrollSidebarProps) {
  const [stampingId, setStampingId] = useState<string | null>(null);

  const handleToggle = useCallback(
    (id: string) => {
      const todo = todos.find((t) => t.id === id);
      if (todo && todo.status === 'pending') {
        setStampingId(id);
        setTimeout(() => setStampingId(null), 800);
      }
      onToggleTodo(id);
    },
    [todos, onToggleTodo]
  );

  const getAgentName = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.name ?? '未知';
  };

  const getAgentStatus = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.status ?? 'offline';
  };

  return (
    <motion.div
      className="absolute right-0 top-0 bottom-0 z-20 flex flex-col border-l"
      style={{
        width: collapsed ? 48 : 320,
        borderColor: '#8B4513',
        background: 'rgba(10, 10, 15, 0.92)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.6, ease: 'easeOut' }}
    >
      {/* 折叠按钮 */}
      <button
        className="flex items-center justify-center h-12 border-b"
        style={{ borderColor: '#8B451388', color: '#ffd700' }}
        onClick={onToggleCollapse}
      >
        {collapsed ? '◀' : '▶'}
      </button>

      {!collapsed && (
        <>
          {/* 标题 */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#8B451388' }}>
            <h2 className="text-sm font-bold tracking-widest" style={{ color: '#ffd700' }}>
              电子奏折
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
              待办事项 {todos.filter((t) => t.status === 'pending').length} / {todos.length}
            </p>
          </div>

          {/* 竹简纹理背景 */}
          <div className="flex-1 overflow-y-auto bamboo-texture px-3 py-3 space-y-3">
            {/* 实时状态 */}
            <div className="space-y-2 mb-4">
              {agents
                .filter((a) => a.status !== 'offline')
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 text-[11px]"
                    style={{ color: '#9ca3af' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          agent.status === 'busy'
                            ? '#ffd700'
                            : agent.status === 'slacking'
                            ? '#39ff14'
                            : '#00f0ff',
                      }}
                    />
                    <span style={{ color: '#e0e0e0' }}>{agent.name}</span>
                    <span className="truncate">{agent.status === 'busy' ? '忙碌中…' : '待命'}</span>
                  </div>
                ))}
            </div>

            {/* 待办条目 */}
            <AnimatePresence>
              {todos.map((todo) => {
                const isDone = todo.status === 'done';
                const isStamping = stampingId === todo.id;
                const agentStatus = getAgentStatus(todo.agentId);
                const isAgentOffline = agentStatus === 'offline';

                return (
                  <motion.div
                    key={todo.id}
                    className="relative rounded px-3 py-2.5"
                    style={{
                      borderLeft: `3px solid ${isDone ? '#00f0ff' : '#ff2a6d'}`,
                      background: 'rgba(10,10,15,0.7)',
                      opacity: isDone ? 0.6 : 1,
                    }}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: isDone ? 0.6 : 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        className="mt-0.5 flex-shrink-0"
                        onClick={() => handleToggle(todo.id)}
                        disabled={isAgentOffline}
                      >
                        {isDone ? (
                          <CheckCircle2 size={14} color="#00f0ff" />
                        ) : (
                          <Circle size={14} color="#ff2a6d" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium leading-snug"
                          style={{
                            color: isDone ? '#9ca3af' : '#e0e0e0',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {todo.title}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#666' }}>
                          {getAgentName(todo.agentId)}
                          {isAgentOffline && (
                            <span className="ml-1" style={{ color: '#ff2a6d' }}>
                              (Agent 离线)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 朱砂印章动画 */}
                    <AnimatePresence>
                      {isStamping && (
                        <motion.div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 font-bold"
                          style={{
                            width: 36,
                            height: 36,
                            borderColor: '#ff2a6d',
                            background: 'rgba(255,42,109,0.9)',
                            color: '#fff',
                            fontSize: 14,
                            boxShadow: '0 0 12px rgba(255,42,109,0.5)',
                          }}
                          initial={{ y: -50, scale: 1.2, opacity: 1 }}
                          animate={{ y: 0, scale: 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                          准
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {todos.length === 0 && (
              <div className="text-center py-8 text-[11px]" style={{ color: '#666' }}>
                暂无待办奏折
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
