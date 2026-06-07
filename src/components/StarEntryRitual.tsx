/** ============================================================
 *  模块 6：StarEntryRitual — 星宿归位加载仪式
 *  9 颗星辰飞入归位 → 落地化形 → 工位亮起
 *  ============================================================ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent } from '../data';

interface StarEntryRitualProps {
  agents: Agent[];
  onComplete: () => void;
}

interface StarState {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  phase: 'flying' | 'landing' | 'done';
}

export default function StarEntryRitual({ agents, onComplete }: StarEntryRitualProps) {
  const [stars, setStars] = useState<StarState[]>([]);
  const [showLight, setShowLight] = useState(false);
  const [showShoufuBeam, setShowShoufuBeam] = useState(false);
  const [allDone, setAllDone] = useState(false);

  /* 初始化星辰 */
  useEffect(() => {
    const shoufu = agents.find((a) => a.id === 'shoufu');
    const others = agents.filter((a) => a.id !== 'shoufu');

    const initialStars: StarState[] = [
      ...others.map((agent) => ({
        id: agent.id,
        startX: Math.random() * window.innerWidth,
        startY: Math.random() * window.innerHeight,
        targetX: (agent.position.x / 100) * window.innerWidth,
        targetY: (agent.position.y / 100) * window.innerHeight,
        phase: 'flying' as const,
      })),
      ...(shoufu
        ? [
            {
              id: shoufu.id,
              startX: window.innerWidth / 2,
              startY: -200,
              targetX: (shoufu.position.x / 100) * window.innerWidth,
              targetY: (shoufu.position.y / 100) * window.innerHeight,
              phase: 'flying' as const,
            },
          ]
        : []),
    ];
    setStars(initialStars);
  }, [agents]);

  /* 星辰到达后触发落地化形 */
  const handleStarArrive = useCallback(
    (id: string) => {
      setStars((prev) => prev.map((s) => (s.id === id ? { ...s, phase: 'landing' } : s)));
    },
    []
  );

  /* 落地完成后 */
  const handleLandComplete = useCallback(
    (id: string) => {
      setStars((prev) => prev.map((s) => (s.id === id ? { ...s, phase: 'done' } : s)));
    },
    []
  );

  /* 监听所有完成 */
  useEffect(() => {
    if (stars.length === 0) return;
    const allLanding = stars.every((s) => s.phase === 'landing' || s.phase === 'done');
    const allDone = stars.every((s) => s.phase === 'done');

    if (allLanding && !showLight) {
      setShowLight(true);
    }

    if (allDone) {
      const timer = setTimeout(() => {
        setShowShoufuBeam(true);
        setTimeout(() => {
          setAllDone(true);
          setTimeout(() => onComplete(), 400);
        }, 800);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [stars, showLight, onComplete]);

  /* 非首辅星辰 */
  const normalStars = stars.filter((s) => s.id !== 'shoufu');
  const shoufuStar = stars.find((s) => s.id === 'shoufu');

  if (allDone) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 100 }}>
      {/* 普通星辰 */}
      {normalStars.map((star, index) => (
        <AnimatePresence key={star.id}>
          {star.phase !== 'done' && (
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 24,
                height: 24,
                background: 'radial-gradient(circle, #ffd700, rgba(255,215,0,0.3), transparent)',
                boxShadow: '0 0 20px #ffd700, 0 0 40px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2)',
              }}
              initial={{ x: star.startX, y: star.startY, scale: 2, opacity: 1 }}
              animate={
                star.phase === 'flying'
                  ? { x: star.targetX - 12, y: star.targetY - 12, scale: 2, opacity: 1 }
                  : { x: star.targetX - 12, y: star.targetY - 12, scale: 0.5, opacity: 0 }
              }
              transition={
                star.phase === 'flying'
                  ? { duration: 1.5, ease: 'circOut', delay: index * 0.15 }
                  : { duration: 0.4, ease: 'easeOut' }
              }
              onAnimationComplete={() => {
                if (star.phase === 'flying') handleStarArrive(star.id);
                else handleLandComplete(star.id);
              }}
            />
          )}
        </AnimatePresence>
      ))}

      {/* 首辅星辰压轴 */}
      {shoufuStar && shoufuStar.phase !== 'done' && (
        <AnimatePresence>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 36,
              height: 36,
              background: 'radial-gradient(circle, #ffd700, rgba(255,215,0,0.5), transparent)',
              boxShadow: '0 0 30px #ffd700, 0 0 60px rgba(255,215,0,0.5), 0 0 100px rgba(255,215,0,0.3)',
            }}
            initial={{ x: shoufuStar.startX - 18, y: shoufuStar.startY - 18, scale: 2, opacity: 1 }}
            animate={
              shoufuStar.phase === 'flying'
                ? { x: shoufuStar.targetX - 18, y: shoufuStar.targetY - 18, scale: 2, opacity: 1 }
                : { x: shoufuStar.targetX - 18, y: shoufuStar.targetY - 18, scale: 0.5, opacity: 0 }
            }
            transition={
              shoufuStar.phase === 'flying'
                ? { duration: 1.5, ease: 'circOut', delay: normalStars.length * 0.15 + 0.3 }
                : { duration: 0.4, ease: 'easeOut' }
            }
            onAnimationComplete={() => {
              if (shoufuStar.phase === 'flying') handleStarArrive(shoufuStar.id);
              else handleLandComplete(shoufuStar.id);
            }}
          />
        </AnimatePresence>
      )}

      {/* 首辅金色光柱 */}
      {showShoufuBeam && shoufuStar && (
        <motion.div
          className="absolute"
          style={{
            left: shoufuStar.targetX - 60,
            top: shoufuStar.targetY - 100,
            width: 120,
            height: 200,
            background: 'radial-gradient(ellipse, rgba(255,215,0,0.3), transparent 70%)',
            filter: 'blur(20px)',
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* 工位灯光亮起 */}
      {showLight &&
        agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            className="absolute rounded-full"
            style={{
              left: `${agent.position.x}%`,
              top: `${agent.position.y}%`,
              width: 8,
              height: 8,
              transform: 'translate(-50%, -50%)',
              background: agent.status === 'offline' ? '#666' : '#00f0ff',
              boxShadow: `0 0 12px ${agent.status === 'offline' ? '#666' : '#00f0ff'}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
          />
        ))}
    </div>
  );
}
