/** ============================================================
 *  模块 2：AgentAvatar — 全息投影小人
 *  状态：在线 / 忙碌 / 摸鱼 / 离线
 *  ============================================================ */

import { motion } from 'framer-motion';

interface AgentAvatarProps {
  glow: string;
  action: 'idle' | 'typing' | 'sleeping' | 'ghost';
  size?: number;
}

export default function AgentAvatar({ glow, action, size = 64 }: AgentAvatarProps) {
  const isGhost = action === 'ghost';
  const isSleeping = action === 'sleeping';
  const isTyping = action === 'typing';

  /* ── 状态光晕 ── */
  const glowStyles = () => {
    if (isGhost) return {};
    if (isTyping) {
      return {
        boxShadow: `0 0 20px ${glow}, 0 0 40px ${glow}44`,
        animation: 'breathe 0.8s ease-in-out infinite',
      };
    }
    if (isSleeping) {
      return {
        boxShadow: `0 0 15px ${glow}, 0 0 30px ${glow}33`,
        animation: 'breathe 5s ease-in-out infinite',
      };
    }
    return {
      boxShadow: `0 0 20px ${glow}, 0 0 40px ${glow}33`,
      animation: 'breathe 3s ease-in-out infinite',
    };
  };

  /* ── 动作变体 ── */
  const bodyVariants = {
    idle: {
      y: [0, -4, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
    },
    typing: {
      y: [0, -3, 0, -3, 0],
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' as const },
    },
    sleeping: {
      rotateX: 45,
      y: 10,
      transition: { duration: 2, ease: 'easeOut' as const },
    },
    ghost: {
      opacity: 0.4,
      filter: 'grayscale(100%)',
      transition: { duration: 0.5 },
    },
  };

  /* ── 手/臂动作 ── */
  const armLeftVariants = {
    idle: { rotate: [0, 5, 0], transition: { duration: 3, repeat: Infinity } },
    typing: { rotate: [0, -15, 0, -15, 0], transition: { duration: 0.8, repeat: Infinity } },
    sleeping: { rotate: 20, y: 4, transition: { duration: 1 } },
    ghost: { opacity: 0.3 },
  };
  const armRightVariants = {
    idle: { rotate: [0, -5, 0], transition: { duration: 3, repeat: Infinity } },
    typing: { rotate: [0, 15, 0, 15, 0], transition: { duration: 0.8, repeat: Infinity } },
    sleeping: { rotate: -20, y: 4, transition: { duration: 1 } },
    ghost: { opacity: 0.3 },
  };

  const s = size;
  const headSize = s * 0.4;
  const bodyWidth = s * 0.35;
  const bodyHeight = s * 0.45;

  return (
    <div className="relative" style={{ width: s, height: s }}>
      {/* 光晕层 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          ...glowStyles(),
          background: `radial-gradient(circle, ${glow}22, transparent 70%)`,
        }}
      />

      {/* 小人 */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        variants={bodyVariants}
        animate={action}
        initial={false}
        style={{ perspective: 200 }}
      >
        {/* 头 */}
        <div
          className="rounded-full"
          style={{
            width: headSize,
            height: headSize,
            background: `radial-gradient(circle at 30% 30%, ${glow}66, ${glow}22)`,
            border: `1px solid ${glow}88`,
            backdropFilter: 'blur(4px)',
          }}
        />
        {/* 身体 */}
        <div className="relative" style={{ width: bodyWidth, height: bodyHeight }}>
          {/* 躯干 */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-lg"
            style={{
              width: bodyWidth * 0.7,
              height: bodyHeight * 0.7,
              background: `linear-gradient(180deg, ${glow}44, ${glow}11)`,
              border: `1px solid ${glow}55`,
              backdropFilter: 'blur(4px)',
            }}
          />
          {/* 左臂 */}
          <motion.div
            className="absolute top-1 left-0 origin-top"
            variants={armLeftVariants}
            animate={action}
            initial={false}
            style={{
              width: bodyWidth * 0.2,
              height: bodyHeight * 0.5,
              background: `linear-gradient(180deg, ${glow}55, transparent)`,
              borderRadius: 4,
            }}
          />
          {/* 右臂 */}
          <motion.div
            className="absolute top-1 right-0 origin-top"
            variants={armRightVariants}
            animate={action}
            initial={false}
            style={{
              width: bodyWidth * 0.2,
              height: bodyHeight * 0.5,
              background: `linear-gradient(180deg, ${glow}55, transparent)`,
              borderRadius: 4,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
