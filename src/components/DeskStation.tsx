/** ============================================================
 *  模块 3：DeskStation — 中式书案工位
 *  包含：案几、Agent、部徽、首辅特权
 *  ============================================================ */

import { motion } from 'framer-motion';
import type { Agent } from '../data';
import AgentAvatar from './AgentAvatar';
import { Crown, ScrollText, Calculator, Wine, Sword, Scale, Wrench, Warehouse, Rocket } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  crown: Crown,
  scroll: ScrollText,
  calculator: Calculator,
  wine: Wine,
  sword: Sword,
  scale: Scale,
  wrench: Wrench,
  warehouse: Warehouse,
  rocket: Rocket,
};

interface DeskStationProps {
  agent: Agent;
  isShoufu?: boolean;
  onClick: () => void;
  index: number;
  entryDone: boolean;
}

export default function DeskStation({ agent, isShoufu = false, onClick, index, entryDone }: DeskStationProps) {
  const { status, position, avatar, name, department } = agent;
  const isOffline = status === 'offline';

  const IconComp = iconMap[department === '首辅' ? 'crown' : department === '吏' ? 'scroll' : department === '户' ? 'calculator' : department === '礼' ? 'wine' : department === '兵' ? 'sword' : department === '刑' ? 'scale' : department === '工' ? 'wrench' : department === '仓' ? 'warehouse' : 'rocket'];

  const statusText = {
    online: '在线',
    busy: '忙碌',
    slacking: '摸鱼',
    offline: '离线',
  }[status];

  const statusColor = {
    online: '#00f0ff',
    busy: '#ffd700',
    slacking: '#39ff14',
    offline: '#666',
  }[status];

  return (
    <motion.div
      className="absolute flex flex-col items-center cursor-pointer"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: position.zIndex,
        transform: `translate(-50%, -50%) scale(${position.scale})`,
      }}
      initial={entryDone ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      animate={entryDone ? { opacity: isOffline ? 0.7 : 1, scale: 1 } : { opacity: 0, scale: 0 }}
      transition={entryDone ? { delay: index * 0.1, duration: 0.5, ease: 'easeOut' } : {}}
      whileHover={entryDone ? { scale: position.scale * 1.05, y: -4 } : {}}
      onClick={onClick}
    >
      {/* 首辅匾额 */}
      {isShoufu && (
        <motion.div
          className="absolute -top-14 px-3 py-1 rounded border text-xs font-bold tracking-widest"
          style={{
            borderColor: '#ffd700',
            background: 'rgba(0,0,0,0.7)',
            color: '#ffd700',
            boxShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={entryDone ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          首辅
        </motion.div>
      )}

      {/* 首辅蟠龙屏风 */}
      {isShoufu && (
        <motion.div
          className="absolute -bottom-8 w-40 h-24 rounded-lg opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(255,215,0,0.15), transparent)',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
          initial={{ opacity: 0 }}
          animate={entryDone ? { opacity: 0.2 } : {}}
          transition={{ delay: 2, duration: 1 }}
        />
      )}

      {/* 国风标识牌 */}
      <motion.div
        className="absolute -top-8 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap border"
        style={{
          borderColor: '#ffd70088',
          background: 'rgba(10,10,15,0.85)',
          color: '#e0e0e0',
          backdropFilter: 'blur(4px)',
        }}
        initial={{ opacity: 0, y: -5 }}
        animate={entryDone ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
      >
        {name}
        <span className="ml-1 text-[9px]" style={{ color: statusColor }}>
          {statusText}
        </span>
      </motion.div>

      {/* Agent 小人 */}
      <div className="relative z-10">
        <AgentAvatar glow={avatar.glow} action={avatar.action} size={isShoufu ? 72 : 56} />
      </div>

      {/* 书案 */}
      <motion.div
        className="relative mt-2 rounded"
        style={{
          width: isShoufu ? 180 : 130,
          height: isShoufu ? 12 : 8,
          borderTop: '3px solid #8B4513',
          background: 'linear-gradient(180deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02))',
          boxShadow: isShoufu
            ? '0 0 20px rgba(0,240,255,0.15), 0 4px 12px rgba(0,0,0,0.5)'
            : '0 0 12px rgba(0,240,255,0.08), 0 2px 8px rgba(0,0,0,0.4)',
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={entryDone ? { opacity: 1, scaleX: 1 } : {}}
        transition={{ delay: 0.6 + index * 0.1, duration: 0.4, ease: 'easeOut' }}
      >
        {/* 案面全息光 */}
        <div
          className="absolute inset-0 rounded"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.06), transparent)',
          }}
        />
      </motion.div>

      {/* 部徽 */}
      <motion.div
        className="absolute -bottom-3 -left-1 flex items-center justify-center rounded-full border"
        style={{
          width: 20,
          height: 20,
          borderColor: '#ffd70088',
          background: 'rgba(10,10,15,0.9)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={entryDone ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1 + index * 0.08, duration: 0.3, type: 'spring' }}
      >
        {IconComp && <IconComp size={10} color="#ffd700" />}
      </motion.div>
    </motion.div>
  );
}
