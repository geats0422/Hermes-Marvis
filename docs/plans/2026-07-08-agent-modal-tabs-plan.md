# Agent 详情弹窗（大殿）Tab 化实施计划

## 总览
将现有 `ScrollDetailModal` 从“三栏固定面板”改造为按 **进化档案 | 技能图谱 | 运行时 | 记忆 | 记录 | 配置** 组织的 Tab 详情弹窗。新增一个只读 `profile-server`（端口 8645），暴露 `C:\Users\kabuto\.hermes\profiles` 下的真实 Agent 配置、技能、日志和全局记忆文件。前端通过 `src/api/profile.ts` 消费，并在 Vite 中通过 `/profile-api` 代理。

## 前置准备
- [x] 设计文档已批准：`docs/designs/2026-07-08-agent-modal-tabs-design.md`
- [x] 确认本地已存在 `C:\Users\kabuto\.hermes\profiles`（目标环境已确认）
- [ ] 运行 `npm run lint` 和 `npx tsc -b` 确认当前基线通过
- [x] 确认 `VITE_HERMES_API_KEY` 在 `.env.local` 中已配置

## 任务列表

### 任务 1: 创建 profile-server.js (~5 min)
- **描述**: 实现一个只读 Node.js 服务，暴露 `C:\Users\kabuto\.hermes\profiles` 下各 Agent 的数据，同时暴露全局记忆文件。
- **文件**: 
  - 创建 `scripts/profile-server.js`
- **测试**: 
  - `node scripts/profile-server.js` 启动后，用 `curl` 或 PowerShell `Invoke-RestMethod` 访问：
    - `http://localhost:8645/shoufu/info`
    - `http://localhost:8645/shoufu/skills`
    - `http://localhost:8645/shoufu/logs`
    - `http://localhost:8645/memories/MEMORY.md`
    - `http://localhost:8645/memories/USER.md`
  - 访问不存在的 Agent 应返回 `404` JSON 错误。
- **验证**: 
  - 端口 8645 正常监听。
  - 所有 endpoint 返回正确 Content-Type 与结构。
  - 对 `..` 等路径返回 403。
- **依赖**: 无

### 任务 2: 配置 Vite 代理与 dev 启动 (~3 min)
- **描述**: 在 Vite 中新增 `/profile-api` 代理到 `127.0.0.1:8645`，并在 `npm run dev` 中并行启动 profile-server。
- **文件**: 
  - 修改 `vite.config.ts`
  - 修改 `package.json`
- **测试**: 
  - 运行 `npm run dev`，确认三个服务（vite / obsidian / profile）都启动。
  - 在浏览器 DevTools 中请求 `/profile-api/shoufu/info` 返回 JSON。
- **验证**: 
  - `npm run dev` 无报错退出。
  - 代理 rewrite 正确去掉 `/profile-api` 前缀。
- **依赖**: 任务 1

### 任务 3: 新增前端 API 层 src/api/profile.ts (~3 min)
- **描述**: 定义 profile 数据类型并封装 fetch 函数。
- **文件**: 
  - 创建 `src/api/profile.ts`
- **测试**: 
  - 在临时 snippet 中导入并调用各函数：
    - `getAgentProfileInfo('shoufu')`
    - `getAgentSkills('shoufu')`
    - `getAgentLogs('shoufu', 30)`
    - `getGlobalMemory('MEMORY.md')`
  - 打印结果并核对字段。
- **验证**: 
  - `npx tsc -b` 无类型错误。
  - 所有函数签名与 `profile-server` 返回一致。
- **依赖**: 任务 2

### 任务 4: 重构 ScrollDetailModal 为 Tab 布局 (~4 min)
- **描述**: 保留 header、关闭、Escape 处理，新增 Tab 状态与导航栏，将原来固定三栏内容替换为按 Tab 渲染。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 打开弹窗，点击 6 个 Tab，确认 active 状态高亮。
  - 切换 Tab 时不关闭弹窗。
- **验证**: 
  - UI 无错位。
  - `npm run lint` 通过。
- **依赖**: 无

### 任务 5: 实现 EvolutionTab (~2 min)
- **描述**: 本次仅作为占位，展示静态进化时间线结构与“等待用户补充数据”提示。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 切换到“进化档案”Tab，可见占位提示与时间线占位点。
- **验证**: 
  - 不影响其它 Tab 渲染。
- **依赖**: 任务 4

### 任务 6: 实现 SkillsTab (~3 min)
- **描述**: 从 `profile-server` 读取真实技能列表，以网格卡片展示技能名与描述。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 打开各 Agent 的“技能图谱”，卡片数量与 `skills/` 目录下子目录数一致。
  - 缺少 `DESCRIPTION.md` 时仍显示 skill id，不报错。
- **验证**: 
  - 独立 loading / error 状态。
  - 空列表显示“尚未安装技能”。
- **依赖**: 任务 3、任务 4

### 任务 7: 实现 RuntimeTab (~3 min)
- **描述**: 展示实时状态徽章 + 最近 `agent.log` 日志 tail。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 运行时 Tab 显示与 header 一致的状态。
  - 日志列表显示最近 N 行，级别颜色正确。
- **验证**: 
  - `getAgentLogs` 失败时显示错误提示与重试按钮。
- **依赖**: 任务 3、任务 4

### 任务 8: 实现 MemoryTab (~3 min)
- **描述**: 展示 `useAgentMemory` 提取的 Agent 记忆，以及全局 `MEMORY.md` / `USER.md` 摘要。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 记忆 Tab 显示 Agent 时间线。
  - 同时显示全局记忆卡片或折叠区块。
- **验证**: 
  - 全局记忆读取失败时显示提示，不影响 Agent 记忆展示。
- **依赖**: 任务 3、任务 4

### 任务 9: 实现 RecordsTab (~5 min)
- **描述**: 将现有即时聊天区迁移到“记录”Tab 的“对话”子 Tab，同时提供“日志”和“任务”两个子视图。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 在“记录 → 对话”中发送消息，SSE 正常接收。
  - 切换“日志”子 Tab 显示 profile-server 日志。
  - 切换“任务”子 Tab 显示 `agent.memory` 中 `type === 'task'` 的条目。
- **验证**: 
  - `useChat` 的 agent 上下文与之前一致。
  - 附件、图片粘贴功能仍然可用。
- **依赖**: 任务 3、任务 4

### 任务 10: 实现 ConfigTab (~4 min)
- **描述**: 三栏/下拉切换展示 `SOUL.md`（Markdown 渲染）、`config.yaml`（代码块）、`.env`（代码块）。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`
- **测试**: 
  - 切换三个文件按钮，内容正确。
  - SOUL.md 使用 `react-markdown` 渲染标题、列表。
  - YAML / env 显示原始文本代码块。
- **验证**: 
  - 文件不存在时显示“该 Agent 尚未配置 profile”。
  - `npx tsc -b` 无 Markdown 组件类型错误。
- **依赖**: 任务 3、任务 4

### 任务 11: 最终整合与验证 (~5 min)
- **描述**: 整合所有 Tab 渲染，确保每个 Tab 独立 loading/error，运行完整构建与手动验收。
- **文件**: 
  - 修改 `src/components/ScrollDetailModal.tsx`（最终整合）
- **测试**: 
  - `npx tsc -b` 通过。
  - `npm run lint` 通过。
  - `npm run dev` 中依次打开 9 个 Agent，每个 Agent 切换 6 个 Tab，确认无白屏。
  - 网络面板确认 `/profile-api` 请求正常。
- **验证**: 
  - 构建命令无错误。
  - 所有 Tab 数据正常加载或给出友好错误提示。
- **依赖**: 任务 2、任务 5-10

## 并行机会
- 任务 1 与任务 4 可以并行开始（后端服务与前端 Tab 骨架互不影响）。
- 任务 5-10 的 Tab 实现可以在任务 4 完成后并行开发。
- 任务 2 需等待任务 1 完成；任务 3 需等待任务 2 完成。

## 风险 & 缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| `profile-server` 路径遍历导致文件泄露 | 低 | 高 | 使用 `path.resolve` + `startsWith(baseDir)` 严格校验；仅允许白名单文件 |
| 技能目录缺少 `DESCRIPTION.md` 导致描述为空 | 中 | 低 | 降级使用 skill id 作为 name，description 显示“暂无描述” |
| `npm run dev` 命令过长或 Windows 转义错误 | 中 | 中 | 在 PowerShell 中实际运行一次；必要时将命令抽到 `scripts/start-dev.js` |
| `ScrollDetailModal` 文件体积过大 | 中 | 中 | 本次先保持单文件；若超过 500 行再拆分为 `components/AgentProfileTabs.tsx` |

## 测试策略

| 层级 | 内容 | 覆盖目标 |
|------|------|----------|
| 手动服务测试 | profile-server 各 endpoint 正确返回 | 所有 endpoint 都命中 |
| 类型检查 | `npx tsc -b` | 0 error |
| 代码规范 | `npm run lint` | 0 error |
| UI 手动验收 | 9 个 Agent × 6 个 Tab 正常显示 | 主流程无白屏、无崩溃 |
| 端到端冒烟 | `npm run build` 成功 | 构建通过 |

## 下一步
1. 确认此计划后，从任务 1 开始实施。
2. 任务 1-3 完成后，建议暂停一次，确认 `profile-server` 与 Vite 代理已联通再继续前端 Tab 实现。
