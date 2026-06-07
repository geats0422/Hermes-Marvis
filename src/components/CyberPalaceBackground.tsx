/** ============================================================
 *  模块 1：CyberPalaceBackground — 赛博宫廷背景层
 *  包含：星空、流光柱、飞檐轮廓
 *  ============================================================ */

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/* ── 星空 ── */
function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: 'radial-gradient(circle, #fff, transparent)',
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── 流星 ── */
function MeteorShower() {
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = nextId.current++;
      const startY = Math.random() * 40;
      const duration = Math.random() * 1 + 1.5;
      setMeteors((prev) => [...prev, { id, startY, duration }]);
      setTimeout(() => {
        setMeteors((prev) => prev.filter((m) => m.id !== id));
      }, duration * 1000 + 200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {meteors.map((m) => (
        <div
          key={m.id}
          className="absolute h-px"
          style={{
            top: `${m.startY}%`,
            left: 0,
            width: 120,
            background: 'linear-gradient(90deg, transparent, #fff, #00f0ff, transparent)',
            animation: `meteor ${m.duration}s linear forwards`,
            transform: 'rotate(-15deg)',
            boxShadow: '0 0 6px #00f0ff, 0 0 12px rgba(0,240,255,0.5)',
          }}
        />
      ))}
    </div>
  );
}

/* ── 流光蟠龙柱 ── */
function Pillar({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      className="absolute top-0 w-16 h-full pointer-events-none"
      style={{
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        background: `linear-gradient(180deg, transparent 0%, rgba(0,240,255,0.06) 20%, rgba(0,240,255,0.1) 50%, rgba(0,240,255,0.06) 80%, transparent 100%)`,
        animation: 'pillarFlow 8s linear infinite',
        backgroundSize: '100% 200%',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1.5 }}
    >
      {/* 龙纹装饰 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 64 800"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={`dragon-${side}`} patternUnits="userSpaceOnUse" width="64" height="128">
            <path
              d="M32 10 C20 20, 10 40, 32 60 C50 40, 40 20, 32 10 M32 70 C20 80, 10 100, 32 120 C50 100, 40 80, 32 70"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="64" height="800" fill={`url(#dragon-${side})`} />
      </svg>
    </motion.div>
  );
}

/* ── 飞檐轮廓 ── */
function EaveOutline() {
  return (
    <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-32"
        viewBox="0 0 800 128"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.3)) drop-shadow(0 0 20px rgba(0,240,255,0.1))' }}
      >
        <path
          d="M 50 100 Q 100 60, 150 80 Q 200 40, 250 60 Q 300 30, 400 40 Q 500 30, 550 60 Q 600 40, 650 80 Q 700 60, 750 100 L 750 110 L 50 110 Z"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="1.5"
          opacity="0.2"
          style={{ animation: 'breathe 4s ease-in-out infinite' }}
        />
        <path
          d="M 80 100 Q 120 70, 160 85 Q 200 55, 240 70 Q 280 45, 400 50 Q 520 45, 560 70 Q 600 55, 640 85 Q 680 70, 720 100"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="0.8"
          opacity="0.1"
          style={{ animation: 'breathe 5s ease-in-out infinite 1s' }}
        />
      </svg>
    </div>
  );
}

/* ── 地宫光晕 ── */
function FloorGlow() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(0,240,255,0.08) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}

/* ── 主组件 ── */
import { useState } from 'react';

interface Meteor {
  id: number;
  startY: number;
  duration: number;
}

export default function CyberPalaceBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <StarField />
      <MeteorShower />
      <Pillar side="left" />
      <Pillar side="right" />
      <EaveOutline />
      <FloorGlow />
    </div>
  );
}
