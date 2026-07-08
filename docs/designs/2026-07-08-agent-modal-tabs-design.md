# Agent 详情弹窗（大殿）Tab 设计

## 目标
完善 Hermes-Marvis 的"大殿"（Cyber Palace）Agent 详情弹窗，点击首辅/八部 Agent 后展示按 `进化档案 | 技能图谱 | 运行时 | 记忆 | 记录 | 配置` 组织的 Tab 页，每个 Tab 的数据来自 Hermes Agent 在 `C:\Users\kabuto\.hermes\profiles` 下的真实配置与运行状态。

## 用户场景
1. 用户进入大殿，点击某个 Agent（如首辅、户部、兵部）。
2. 弹出 Agent 详情 Modal，顶部显示 Agent 名称/状态/部门。
3. 用户通过 Tab 切换查看：
   - 进化档案：后续自定义的成长/升级记录（本次仅留占位）。
   - 技能图谱：该 Agent 真实安装的技能列表。
   - 运行时：Agent 实时状态 + 最近运行日志。
   - 记忆：从会话提取的 Agent 记忆 + 全局 MEMORY.md/USER.md。
   - 记录：对话历史、运行日志、任务执行记录。
   - 配置：SOUL.md、config.yaml、.env 真实配置内容。

## 技术方案

### 1. 新增 profile-server.js
在 `scripts/profile-server.js` 启动一个轻量 Node.js 服务（默认端口 8645），只读暴露 `C:\Users\kabuto\.hermes\profiles` 下各 Agent 的数据：

- `GET /:agentId/SOUL.md` → SOUL.md 原始 Markdown
- `GET /:agentId/config.yaml` → config.yaml 原始文本
- `GET /:agentId/env` → .env 原始文本
- `GET /:agentId/skills` → skills 目录下所有技能元信息列表
- `GET /:agentId/logs` → logs/agent.log 最近 N 行
- `GET /:agentId/info` → 聚合元信息（profile 存在性、SOUL.md 摘要、技能数量、文件修改时间）

Agent 到 profile 目录映射：

| Agent ID | Profile 目录 |
|----------|--------------|
| shoufu   | shoufu       |
| libu     | libu         |
| hubu     | hubu         |
| libu2    | libu-2       |
| bingbu   | bingbu       |
| xingbu   | xingbu       |
| gongbu   | gongbu       |
| cangbu   | cangbu       |
| yibu     | yibu         |

### 2. Vite proxy 配置
在 `vite.config.ts` 中新增 `/profile-api` 代理到 `http://127.0.0.1:8645`，并复用 Origin 剥离逻辑，避免 CORS 403。

### 3. 前端 API 层
新增 `src/api/profile.ts`：

```ts
export interface AgentProfileInfo {
  agentId: string;
  exists: boolean;
  soulLength: number;
  skillCount: number;
  updatedAt: number;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
}

export interface AgentLogLine {
  time: string;
  level: string;
  message: string;
}

export async function getAgentProfileInfo(agentId: string): Promise<AgentProfileInfo>
export async function getAgentSoul(agentId: string): Promise<string>
export async function getAgentConfig(agentId: string): Promise<string>
export async function getAgentEnv(agentId: string): Promise<string>
export async function getAgentSkills(agentId: string): Promise<AgentSkill[]>
export async function getAgentLogs(agentId: string, limit?: number): Promise<AgentLogLine[]>
```

### 4. 组件改造：ScrollDetailModal
现有 `ScrollDetailModal.tsx` 扩展为带 Tab 的详情面板：

- 左侧/顶部：Agent 头像、名称、状态、部门、简介。
- Tab 栏：进化档案 | 技能图谱 | 运行时 | 记忆 | 记录 | 配置。
- 内容区根据 activeTab 渲染对应子组件。

新增子组件（均放在 `ScrollDetailModal.tsx` 内或独立文件）：

- `EvolutionTab`: 本次仅展示占位提示与静态进化时间线结构。
- `SkillsTab`: 网格展示技能卡片（从 profile-server 读取真实技能）。
- `RuntimeTab`: 顶部状态卡片 + 底部日志 tail。
- `MemoryTab`: 展示 `useAgentMemory` 提取的记忆 + 全局 MEMORY.md/USER.md 摘要。
- `RecordsTab`: 子 Tab 或筛选器展示会话历史 / 日志 / 任务记录。
- `ConfigTab`: 三栏/下拉选择展示 SOUL.md / config.yaml / .env，支持 Markdown 渲染与代码高亮。

### 5. 数据流
1. Modal 打开时传入 `agentId`。
2. 各 Tab 按需调用 `profile.ts` API。
3. 运行时状态仍使用 `useAgentStatus` / `useHermesHealth` 已有 hooks。
4. 记忆 Tab 复用 `useAgentMemory` + 新增全局记忆文件读取接口。

### 6. 错误处理
- profile 不存在时显示友好提示（该 Agent 尚未配置 Hermes profile）。
- 文件读取失败时显示错误提示与重试按钮。
- 每个 Tab 独立 loading / error 状态，避免一个 Tab 失败影响整个 Modal。

### 7. 测试策略
- 手动验证：点击每个 Agent，切换 6 个 Tab，确认数据正常加载。
- 检查 `npx tsc -b` 与 `npm run lint` 无新增错误。
- 验证 profile-server 在 `npm run dev` 中自动启动。

## 未决事项
- 进化档案的具体数据格式由用户后续补充；本次设计只保留占位接口与 UI 结构。
- 运行时是否展示进程 CPU/内存需要进一步确认系统信息来源（先使用 health 状态 + 日志）。

## 下一步
获得设计批准后，使用 `/plan` 生成实施任务。
