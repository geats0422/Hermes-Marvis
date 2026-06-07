# 🏛️ Hermes 赛博宫廷办公室 — 设计规范文档

## 1. 视觉系统

### 色彩体系
| 角色 | 色值 | 用途 |
|------|------|------|
| 墨黑 | `#0a0a0f` | 背景主色 |
| 青蓝 | `#00f0ff` | 全息光、在线状态、交互高亮 |
| 朱砂红 | `#ff2a6d` | 待办紧急、错误、印章 |
| 琉璃金 | `#ffd700` | 首辅特权、技能图标、记忆节点 |
| 木色 | `#8B4513` | 竹简边框、案几、卷轴轴头 |
| 翡翠绿 | `#39ff14` | 摸鱼状态 |
| 主文字 | `#e0e0e0` | 正文（对比度 ≈ 12:1） |
| 次文字 | `#9ca3af` | 描述、时间戳 |

### 字体系统
- 主字体：`Noto Sans SC`（Google Fonts）
- 回退：`system-ui, sans-serif`
- 等宽：`ui-monospace, Consolas, monospace`

### 间距系统
- 基础单位：`4px`
- 工位间距：`desktop: 24px, tablet: 16px`
- 侧边栏宽度：`desktop: 320px, tablet: 280px（可折叠）`

---

## 2. 组件架构图

```
App.tsx
├── CyberPalaceBackground (z-index: 0)
│   ├── StarField (CSS 动画)
│   ├── PillarFlow (4根流光柱)
│   └── EaveOutline (SVG 飞檐)
├── StarEntryRitual (z-index: 100, 仅首次挂载)
│   └── 9 × motion.div (星辰)
├── DeskLayout (z-index: 10)
│   └── 9 × DeskStation
│       ├── AgentAvatar
│       │   └── 国风标识牌
│       └── 部徽 SVG
├── BambooScrollSidebar (z-index: 20)
│   └── TodoList
│       └── TodoItem + StampAnimation
└── ScrollDetailModal (z-index: 50)
    ├── 卷轴轴头（伪元素）
    ├── 配置文档 (30%)
    ├── 技能列表 (35%)
    ├── 工作记录 (35%)
    └── 即时交互 (底部)
```

---

## 3. 动画时序表

| 阶段 | 元素 | 动画 | 时长 | 延迟 | Ease |
|------|------|------|------|------|------|
| 加载 | 星辰 | 随机位置 → 工位坐标 | 1.5s | stagger 0.15s | circOut |
| 落地 | 星辰 | scale 2→0.5, opacity 1→0 | 0.4s | 星辰到达后 | easeOut |
| 化形 | 小人 | scale 0→1, opacity 0→1 | 0.5s | 星辰消失后 | easeOut |
| 亮灯 | 工位 | opacity 0→1 | 0.3s | stagger 0.1s | easeOut |
| 压轴 | 首辅 | y: -200px → 工位 | 1.5s | 前8个完成后 | circOut |
| 光柱 | 首辅 | 金色光柱展开 | 0.8s | 首辅落地后 | easeOut |
| 弹窗 | 卷轴 | scale 0→1, opacity 0→1 | 0.6s | 点击时 | [0.22, 1, 0.36, 1] |
| 关闭 | 卷轴 | scale 1→0.2, opacity 1→0 | 0.4s | 关闭触发 | easeIn |
| 印章 | 朱砂 | y: -50→0, 停留0.5s淡出 | 0.8s | 完成点击时 | easeOut |

---

## 4. 交互状态机

### Agent 状态
```
State: online
  → glow: cyan 呼吸 3s
  → action: idle (轻微上下浮动)
  → 标识牌: 正常显示

State: busy
  → glow: gold 快速脉动 0.8s
  → action: typing (双手敲击 y 往复)
  → 标识牌: 显示任务名称

State: slacking
  → glow: green 缓慢呼吸 5s
  → action: sleeping (rotateX 45deg, y +10px)
  → 标识牌: 半透明

State: offline
  → glow: none
  → action: ghost (opacity 0.4, grayscale 100%)
  → 标识牌: 灰色
```

### 弹窗状态
```
Closed → Open: 点击工位 → layoutId 动画展开
Open → Closed: 点击外部/ESC → 反向卷起
```

---

## 5. 响应式断点

| 断点 | 范围 | 布局模式 |
|------|------|---------|
| Desktop | min-width: 1280px | 近景工位 + 侧边栏 |
| Tablet | 768px - 1279px | 俯瞰宫廷（scale: 0.6, drag 可拖拽） |
| Mobile | max-width: 767px | 简化列表（可选） |

---

## 6. 组件 Props 接口

### CyberPalaceBackground
- `showMeteors?: boolean` — 是否显示流星

### AgentAvatar
- `glow: string` — 光晕颜色
- `action: 'idle' | 'typing' | 'sleeping' | 'ghost'` — 动作状态
- `size?: number` — 尺寸（默认 64）

### DeskStation
- `agent: Agent` — Agent 数据
- `isShoufu?: boolean` — 是否首辅
- `onClick: () => void` — 点击回调

### BambooScrollSidebar
- `todos: Todo[]` — 任务列表
- `agents: Agent[]` — Agent 列表（用于状态联动）
- `onToggleTodo: (id: string) => void` — 完成切换

### ScrollDetailModal
- `agent: Agent | null` — 当前选中 Agent
- `isOpen: boolean` — 是否打开
- `onClose: () => void` — 关闭回调

### StarEntryRitual
- `agents: Agent[]` — Agent 位置数据
- `onComplete: () => void` — 动画完成回调

---

## 7. 依赖关系

- `framer-motion`: 所有动画组件
- `lucide-react`: 技能图标
- `tailwindcss`: 样式系统
- `react`: UI 框架

---

[BLUEPRINT COMPLETE]
