/** ============================================================
 *  AutoTaskPage — 自动任务页面（Marvis 风格）
 *  空状态 + 新建按钮 + 推荐任务卡片
 *  ============================================================ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, TrendingUp, Globe, Clock, Check } from 'lucide-react';

interface TaskPreset {
  id: number;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  added: boolean;
}

const presetTasks: TaskPreset[] = [
  {
    id: 1,
    title: '今日运势',
    desc: '结合我的生日：2021年12月18日 15:00 生成今日每日运势，写明整体运势好坏、今日宜做事项、避忌事项、专属幸运颜色，...',
    icon: Sparkles,
    color: '#00f0ff',
    added: false,
  },
  {
    id: 2,
    title: '同花顺机器人板块个股分析',
    desc: '帮我在同花顺里，看下机器人/人形机器人概念板块，查看板块内个股的涨跌、市值、PE 等关键指标，总结成报告。任务指引：...',
    icon: TrendingUp,
    color: '#ffd700',
    added: false,
  },
  {
    id: 3,
    title: '地球脉动',
    desc: '告知我这一刻地球上在发生什么',
    icon: Globe,
    color: '#39ff14',
    added: false,
  },
];

export default function AutoTaskPage() {
  const [tasks, setTasks] = useState<TaskPreset[]>(presetTasks);
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, added: !t.added } : t))
    );
  };

  const addedCount = tasks.filter((t) => t.added).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部标题栏 ── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <h1 className="text-base font-bold tracking-wider" style={{ color: '#e0e0e0' }}>
          自动任务
        </h1>
        <motion.button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]"
          style={{
            background: 'linear-gradient(135deg, #00f0ff22, #0099cc22)',
            border: '1px solid rgba(0,240,255,0.3)',
            color: '#00f0ff',
          }}
          whileHover={{ boxShadow: '0 0 12px rgba(0,240,255,0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={12} />
          <span>新建</span>
        </motion.button>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {addedCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                style={{
                  background: 'rgba(0,240,255,0.08)',
                  border: '1px solid rgba(0,240,255,0.15)',
                }}
              >
                <Clock size={20} color="#00f0ff" />
              </div>
              <h2 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>
                开启你的第一个自动任务吧
              </h2>
              <p className="text-[11px] text-center max-w-md" style={{ color: '#666' }}>
                Tips：请保持电脑开机并运行客户端，否则在关机、休眠或退出客户端时，自动任务无法执行
              </p>
              <motion.button
                className="flex items-center gap-2 px-5 py-2 rounded-full text-xs mt-2"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #0099cc)',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(0,240,255,0.2)',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(0,240,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
              >
                <Plus size={14} />
                <span>新建自动任务</span>
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {tasks.filter((t) => t.added).map((task) => (
              <TaskCard key={task.id} task={task} onAdd={() => handleAdd(task.id)} />
            ))}
          </div>
        )}

        {/* ── 推荐任务卡片 ── */}
        <div className="mt-4">
          <p className="text-[11px] mb-3 px-1" style={{ color: '#666' }}>
            推荐任务
          </p>
          <div className="grid grid-cols-3 gap-3">
            {tasks.filter((t) => !t.added).map((task, idx) => (
              <motion.div
                key={task.id}
                className="rounded-lg border p-3 flex flex-col"
                style={{
                  borderColor: 'rgba(0,240,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.3 }}
                whileHover={{
                  borderColor: 'rgba(0,240,255,0.25)',
                  boxShadow: `0 0 12px ${task.color}15`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: `${task.color}15` }}
                  >
                    <task.icon size={12} color={task.color} />
                  </div>
                  <span className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>
                    {task.title}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed line-clamp-3 mb-3 flex-1" style={{ color: '#666' }}>
                  {task.desc}
                </p>
                <motion.button
                  className="self-end px-3 py-1 rounded text-[10px]"
                  style={{
                    background: 'rgba(0,240,255,0.08)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    color: '#00f0ff',
                  }}
                  whileHover={{ background: 'rgba(0,240,255,0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAdd(task.id)}
                >
                  添加
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 新建任务弹窗（占位） ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="rounded-xl p-6 max-w-sm w-full mx-4"
              style={{
                background: 'rgba(10,10,15,0.95)',
                border: '1px solid rgba(0,240,255,0.2)',
                boxShadow: '0 0 40px rgba(0,240,255,0.1)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold mb-3" style={{ color: '#e0e0e0' }}>新建自动任务</h3>
              <p className="text-[11px] mb-4" style={{ color: '#9ca3af' }}>
                功能开发中，请选择下方推荐任务快速添加。
              </p>
              <motion.button
                className="w-full py-2 rounded-md text-xs"
                style={{
                  background: 'rgba(0,240,255,0.1)',
                  border: '1px solid rgba(0,240,255,0.2)',
                  color: '#00f0ff',
                }}
                whileHover={{ background: 'rgba(0,240,255,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(false)}
              >
                知道了
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 已添加的任务卡片组件 ── */
function TaskCard({ task, onAdd }: { task: TaskPreset; onAdd: () => void }) {
  return (
    <motion.div
      className="flex items-center gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: `${task.color}30`,
        background: 'rgba(0,0,0,0.4)',
      }}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${task.color}15` }}
      >
        <task.icon size={14} color={task.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate" style={{ color: '#e0e0e0' }}>
          {task.title}
        </p>
        <p className="text-[10px] truncate" style={{ color: '#666' }}>
          {task.desc}
        </p>
      </div>
      <motion.button
        className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
        style={{
          background: `${task.color}15`,
          color: task.color,
          border: `1px solid ${task.color}30`,
        }}
        whileHover={{ background: `${task.color}25` }}
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
      >
        <Check size={10} />
        <span>已添加</span>
      </motion.button>
    </motion.div>
  );
}
