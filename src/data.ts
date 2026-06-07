/** ============================================================
 *  Hermes Agent 数据层 — 赛博宫廷八部 + 首辅
 *  所有字段必须真实填充，开箱即用
 *  ============================================================ */

export interface Skill {
  name: string;
  icon: string;
  description: string;
}

export interface Memory {
  timestamp: string;
  content: string;
  type: 'task' | 'chat' | 'error';
}

export interface Todo {
  id: string;
  title: string;
  status: 'pending' | 'done';
  agentId: string;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  department: '首辅' | '吏' | '户' | '礼' | '兵' | '刑' | '工' | '仓' | '驿';
  status: 'online' | 'busy' | 'slacking' | 'offline';
  position: { x: number; y: number; scale: number; zIndex: number };
  avatar: { glow: string; action: 'idle' | 'typing' | 'sleeping' | 'ghost' };
  config: string;
  skills: Skill[];
  memory: Memory[];
  todos: Todo[];
}

export const agents: Agent[] = [
  // ──────────────────────────────────────────────────────────────
  // 首辅 — 总控调度
  // ──────────────────────────────────────────────────────────────
  {
    id: 'shoufu',
    name: '首辅',
    title: 'Hermes 总控调度',
    department: '首辅',
    status: 'busy',
    position: { x: 50, y: 25, scale: 1.3, zIndex: 10 },
    avatar: { glow: '#ffd700', action: 'typing' },
    config: `## 首辅配置

- **调度策略**: 优先级队列 + 加权轮询
- **最大并发**: 8 个 Agent 同时运行
- **心跳间隔**: 30s 健康检查
- **熔断阈值**: 连续 3 次异常自动隔离
- **记忆总线**: Redis Stream 聚合多 Agent 记忆
- **日志等级**: INFO（生产）/ DEBUG（调试）
- **告警通道**: 飞书 + 邮件双重通知`,
    skills: [
      { name: '全局调度', icon: 'compass', description: '协调八部任务分配与负载均衡' },
      { name: '状态监控', icon: 'eye', description: '实时监控 Agent 健康度与心跳' },
      { name: '异常熔断', icon: 'shield', description: '自动隔离故障 Agent 并触发告警' },
      { name: '记忆总线', icon: 'brain', description: '聚合多 Agent 记忆库，防止上下文丢失' },
    ],
    memory: [
      { timestamp: '2026-06-07 14:32', content: '协调工部完成 API 接入测试', type: 'task' },
      { timestamp: '2026-06-07 15:10', content: '检测到仓部存储异常，已自动切换备份', type: 'error' },
      { timestamp: '2026-06-07 16:45', content: '向用户汇报今日任务进度与明日计划', type: 'chat' },
    ],
    todos: [],
  },

  // ──────────────────────────────────────────────────────────────
  // 吏部 — Agent 人事管理
  // ──────────────────────────────────────────────────────────────
  {
    id: 'libu',
    name: '吏部尚书',
    title: 'Agent 人事管理',
    department: '吏',
    status: 'online',
    position: { x: 20, y: 55, scale: 1.0, zIndex: 5 },
    avatar: { glow: '#00f0ff', action: 'idle' },
    config: `## 吏部配置

- **职能**: Agent 注册、生命周期管理、权限分配
- **注册表**: Consul Service Mesh
- **鉴权模式**: OAuth2 + JWT
- **权限模型**: RBAC（角色基础访问控制）
- **Agent 模板**: 预设 12 种角色模板
- **审计日志**: 操作全链路追踪`,
    skills: [
      { name: 'Agent 注册', icon: 'user-plus', description: '新 Agent  onboarding 与初始化' },
      { name: '权限管理', icon: 'key', description: 'RBAC 角色分配与权限校验' },
      { name: '生命周期', icon: 'refresh-cw', description: 'Agent 启动、暂停、销毁管理' },
      { name: '审计追踪', icon: 'clipboard-list', description: '操作日志全链路记录' },
    ],
    memory: [
      { timestamp: '2026-06-07 09:15', content: '为驿部新增 3 个 API 调用权限', type: 'task' },
      { timestamp: '2026-06-07 11:20', content: '兵部申请临时提升并发上限，已审批', type: 'task' },
      { timestamp: '2026-06-07 13:00', content: '清理 5 个已注销 Agent 的历史数据', type: 'task' },
    ],
    todos: [
      { id: 'todo-libu-1', title: '审查驿部 API 权限申请', status: 'pending', agentId: 'libu' },
      { id: 'todo-libu-2', title: '更新 Agent 生命周期状态文档', status: 'done', agentId: 'libu' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 户部 — 资源与财务管理
  // ──────────────────────────────────────────────────────────────
  {
    id: 'hubu',
    name: '户部尚书',
    title: '资源与财务管理',
    department: '户',
    status: 'busy',
    position: { x: 40, y: 55, scale: 1.0, zIndex: 5 },
    avatar: { glow: '#ffd700', action: 'typing' },
    config: `## 户部配置

- **职能**: Token 预算、API 配额、成本核算
- **计费模式**: 按 Token 消耗阶梯定价
- **预算上限**: 每月 $5000 USD
- **告警阈值**: 80% 预算触发预警
- **成本分析**: 按 Agent / 按任务维度统计
- **报表输出**: 每日 CSV + 月度 PDF`,
    skills: [
      { name: 'Token 核算', icon: 'coins', description: '实时追踪各 Agent Token 消耗' },
      { name: '预算管理', icon: 'wallet', description: '月度预算分配与预警控制' },
      { name: '成本优化', icon: 'trending-down', description: '智能选择模型与缓存策略' },
      { name: '报表生成', icon: 'file-text', description: '多维度成本分析报表输出' },
    ],
    memory: [
      { timestamp: '2026-06-07 08:30', content: '今日 Token 预算已重置，剩余 $4820', type: 'task' },
      { timestamp: '2026-06-07 10:45', content: '兵部单次调用消耗异常，已通知优化', type: 'error' },
      { timestamp: '2026-06-07 14:00', content: '生成 6 月第一周成本分析报表', type: 'task' },
    ],
    todos: [
      { id: 'todo-hubu-1', title: '核算昨日各 Agent Token 消耗', status: 'done', agentId: 'hubu' },
      { id: 'todo-hubu-2', title: '设置 6 月第二周预算上限', status: 'pending', agentId: 'hubu' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 礼部 — 外部交互与礼仪
  // ──────────────────────────────────────────────────────────────
  {
    id: 'libu2',
    name: '礼部尚书',
    title: '外部交互与礼仪',
    department: '礼',
    status: 'slacking',
    position: { x: 60, y: 55, scale: 1.0, zIndex: 5 },
    avatar: { glow: '#39ff14', action: 'sleeping' },
    config: `## 礼部配置

- **职能**: 用户对话、邮件礼仪、社交媒体
- **语气设定**: 专业且亲切（formal-friendly）
- **回复模板**: 预设 30 种场景回复
- **多语言**: 中/英/日/韩 自动切换
- **情感分析**: 用户情绪识别，动态调整语气
- **礼仪检查**: 自动检测冒犯性内容`,
    skills: [
      { name: '对话礼仪', icon: 'message-circle', description: '用户交互语气与礼仪控制' },
      { name: '多语言', icon: 'globe', description: '多语言自动识别与回复' },
      { name: '情感分析', icon: 'heart', description: '用户情绪识别与策略调整' },
      { name: '模板引擎', icon: 'layout-template', description: '场景化回复模板管理' },
    ],
    memory: [
      { timestamp: '2026-06-07 09:00', content: '回复用户关于 API 使用的咨询邮件', type: 'chat' },
      { timestamp: '2026-06-07 11:30', content: '处理 3 条飞书工单，标记为已解决', type: 'task' },
      { timestamp: '2026-06-07 15:00', content: '检测到用户情绪焦虑，切换安抚语气', type: 'chat' },
    ],
    todos: [
      { id: 'todo-libu2-1', title: '回复积压的 2 封用户邮件', status: 'pending', agentId: 'libu2' },
      { id: 'todo-libu2-2', title: '更新多语言回复模板', status: 'done', agentId: 'libu2' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 兵部 — 安全与攻防
  // ──────────────────────────────────────────────────────────────
  {
    id: 'bingbu',
    name: '兵部尚书',
    title: '安全与攻防',
    department: '兵',
    status: 'online',
    position: { x: 80, y: 55, scale: 1.0, zIndex: 5 },
    avatar: { glow: '#00f0ff', action: 'idle' },
    config: `## 兵部配置

- **职能**: 输入安全、Prompt 注入防御、访问控制
- **防御策略**: 多层过滤（输入→语义→输出）
- **敏感词库**: 实时更新的 10w+ 词库
- **注入检测**: 基于模式匹配 + LLM 语义判断
- **速率限制**: 按 IP / 按用户 / 按 Agent 三级限流
- **攻击日志**: 自动上报可疑行为到 SIEM`,
    skills: [
      { name: '注入防御', icon: 'shield-check', description: 'Prompt 注入与越狱攻击防御' },
      { name: '敏感过滤', icon: 'filter', description: '输入输出敏感内容实时过滤' },
      { name: '速率限制', icon: 'gauge', description: '三级限流保护系统稳定' },
      { name: '威胁情报', icon: 'radar', description: '攻击模式识别与自动响应' },
    ],
    memory: [
      { timestamp: '2026-06-07 07:00', content: '检测到 12 次可疑注入尝试，全部拦截', type: 'error' },
      { timestamp: '2026-06-07 09:30', content: '更新敏感词库，新增 200 条网络流行语', type: 'task' },
      { timestamp: '2026-06-07 12:00', content: '完成每日安全巡检报告', type: 'task' },
    ],
    todos: [
      { id: 'todo-bingbu-1', title: '分析凌晨的异常流量峰值', status: 'pending', agentId: 'bingbu' },
      { id: 'todo-bingbu-2', title: '更新速率限制白名单', status: 'done', agentId: 'bingbu' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 刑部 — 合规与审计
  // ──────────────────────────────────────────────────────────────
  {
    id: 'xingbu',
    name: '刑部尚书',
    title: '合规与审计',
    department: '刑',
    status: 'offline',
    position: { x: 20, y: 80, scale: 0.85, zIndex: 3 },
    avatar: { glow: 'transparent', action: 'ghost' },
    config: `## 刑部配置

- **职能**: 合规检查、数据隐私、审计报告
- **合规标准**: GDPR / CCPA / 国内网络安全法
- **隐私检查**: 自动识别 PII 数据泄露风险
- **审计周期**: 每周自动扫描 + 季度人工复核
- **合规报告**: 自动生成 PDF 提交法务
- **数据保留**: 按法规要求自动清理过期数据`,
    skills: [
      { name: '合规扫描', icon: 'search', description: '自动检测 GDPR/CCPA 合规风险' },
      { name: '隐私保护', icon: 'lock', description: 'PII 识别与数据脱敏处理' },
      { name: '审计报告', icon: 'file-check', description: '合规性审计报告自动生成' },
      { name: '数据治理', icon: 'trash-2', description: '过期数据自动清理与归档' },
    ],
    memory: [
      { timestamp: '2026-06-06 18:00', content: '完成 Q2 合规性扫描，发现 2 处低风险项', type: 'task' },
      { timestamp: '2026-06-06 20:00', content: '系统维护中，已暂停服务', type: 'error' },
      { timestamp: '2026-06-07 06:00', content: '维护完成，等待首辅启动指令', type: 'chat' },
    ],
    todos: [
      { id: 'todo-xingbu-1', title: '修复 Q2 合规扫描中的 2 处低风险项', status: 'pending', agentId: 'xingbu' },
      { id: 'todo-xingbu-2', title: '准备 6 月数据清理计划', status: 'pending', agentId: 'xingbu' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 工部 — 工程与开发
  // ──────────────────────────────────────────────────────────────
  {
    id: 'gongbu',
    name: '工部尚书',
    title: '工程与开发',
    department: '工',
    status: 'busy',
    position: { x: 40, y: 80, scale: 0.85, zIndex: 3 },
    avatar: { glow: '#ffd700', action: 'typing' },
    config: `## 工部配置

- **职能**: API 开发、SDK 维护、工具链
- **技术栈**: TypeScript / Go / Python
- **CI/CD**: GitHub Actions + ArgoCD
- **代码规范**: ESLint + Prettier + Commitlint
- **测试覆盖**: 单元测试 ≥ 80%，E2E 关键路径
- **文档输出**: API 文档自动生成（OpenAPI）`,
    skills: [
      { name: 'API 开发', icon: 'code', description: 'RESTful / GraphQL API 设计与实现' },
      { name: 'SDK 维护', icon: 'package', description: '多语言 SDK 版本管理与发布' },
      { name: '自动化测试', icon: 'test-tube', description: '单元测试、集成测试、E2E 测试' },
      { name: '文档工程', icon: 'book-open', description: 'API 文档与开发者指南自动生成' },
    ],
    memory: [
      { timestamp: '2026-06-07 08:00', content: '开始开发新的批量任务 API 接口', type: 'task' },
      { timestamp: '2026-06-07 11:00', content: '修复 SDK v2.3 中的 TypeScript 类型错误', type: 'error' },
      { timestamp: '2026-06-07 14:30', content: '提交 PR #247，等待 Code Review', type: 'task' },
    ],
    todos: [
      { id: 'todo-gongbu-1', title: '完成批量任务 API 接口开发', status: 'pending', agentId: 'gongbu' },
      { id: 'todo-gongbu-2', title: '修复 SDK v2.3 TS 类型错误', status: 'done', agentId: 'gongbu' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 仓部 — 数据存储与知识库
  // ──────────────────────────────────────────────────────────────
  {
    id: 'cangbu',
    name: '仓部尚书',
    title: '数据存储与知识库',
    department: '仓',
    status: 'online',
    position: { x: 60, y: 80, scale: 0.85, zIndex: 3 },
    avatar: { glow: '#00f0ff', action: 'idle' },
    config: `## 仓部配置

- **职能**: 向量数据库、知识库管理、记忆持久化
- **向量库**: Pinecone + Milvus 双活
- **知识库**: 支持 RAG（检索增强生成）
- **记忆策略**: 短期（Redis）+ 长期（PostgreSQL）
- **数据备份**: 每日增量备份，跨地域容灾
- **检索优化**: 语义检索 + 关键词混合排序`,
    skills: [
      { name: '向量存储', icon: 'database', description: '高维向量索引与相似度检索' },
      { name: 'RAG 检索', icon: 'book-marked', description: '知识库检索增强生成' },
      { name: '记忆持久化', icon: 'hard-drive', description: 'Agent 记忆长期存储与恢复' },
      { name: '数据备份', icon: 'archive', description: '跨地域容灾与增量备份' },
    ],
    memory: [
      { timestamp: '2026-06-07 06:30', content: '完成每日知识库增量索引更新', type: 'task' },
      { timestamp: '2026-06-07 09:00', content: '为兵部安全规则库新增 50 条向量', type: 'task' },
      { timestamp: '2026-06-07 13:30', content: '响应用户查询，检索相关历史文档 12 篇', type: 'chat' },
    ],
    todos: [
      { id: 'todo-cangbu-1', title: '优化向量检索索引，提升 20% 召回率', status: 'pending', agentId: 'cangbu' },
      { id: 'todo-cangbu-2', title: '清理过期临时记忆数据', status: 'done', agentId: 'cangbu' },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 驿部 — 外部接口与通信
  // ──────────────────────────────────────────────────────────────
  {
    id: 'yibu',
    name: '驿部尚书',
    title: '外部接口与通信',
    department: '驿',
    status: 'online',
    position: { x: 80, y: 80, scale: 0.85, zIndex: 3 },
    avatar: { glow: '#00f0ff', action: 'idle' },
    config: `## 驿部配置

- **职能**: 第三方 API 集成、Webhook 管理、消息推送
- **集成平台**: Slack / Discord / 飞书 / Telegram
- **Webhook**: 支持自定义签名验证
- **消息队列**: RabbitMQ 异步处理
- **重试策略**: 指数退避，最大 5 次重试
- **熔断机制**: 下游服务异常时自动切换备用通道`,
    skills: [
      { name: 'API 集成', icon: 'plug', description: '第三方平台 API 接入与适配' },
      { name: 'Webhook 管理', icon: 'webhook', description: 'Webhook 注册、验证与分发' },
      { name: '消息推送', icon: 'send', description: '多通道消息推送与送达追踪' },
      { name: '通道熔断', icon: 'route', description: '下游异常自动切换备用通道' },
    ],
    memory: [
      { timestamp: '2026-06-07 08:15', content: '完成飞书机器人新功能上线', type: 'task' },
      { timestamp: '2026-06-07 10:00', content: 'Discord 频道收到用户反馈，已转发礼部', type: 'chat' },
      { timestamp: '2026-06-07 12:30', content: '修复 Slack Webhook 签名验证超时问题', type: 'error' },
    ],
    todos: [
      { id: 'todo-yibu-1', title: '新增 Telegram 机器人集成', status: 'pending', agentId: 'yibu' },
      { id: 'todo-yibu-2', title: '优化 Webhook 重试队列', status: 'done', agentId: 'yibu' },
    ],
  },
];

export const departmentIconMap: Record<string, string> = {
  首辅: 'crown',
  吏: 'scroll',
  户: 'calculator',
  礼: 'wine',
  兵: 'sword',
  刑: 'scale',
  工: 'wrench',
  仓: 'warehouse',
  驿: 'rocket',
};

export const departmentColorMap: Record<string, string> = {
  首辅: '#ffd700',
  吏: '#00f0ff',
  户: '#ffd700',
  礼: '#39ff14',
  兵: '#00f0ff',
  刑: '#ff2a6d',
  工: '#ffd700',
  仓: '#00f0ff',
  驿: '#00f0ff',
};
