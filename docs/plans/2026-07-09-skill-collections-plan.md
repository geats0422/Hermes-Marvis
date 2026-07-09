# Skill Collections 实施计划

> **对应设计**: `docs/designs/2026-07-09-skill-collections-design.md`

## 总览

让 `SkillsPage`（技能广场）和 `AgentProfileTabs.SkillsTab`（技能图谱）把合集型 skill（`gstack`、`cheat-on-content`、`xinmeiti-huoke` 等）作为带子技能列表的「合集卡片」渲染，一次启用/禁用即整集合生效。

核心策略：
1. **后端**：`profile-server.js` 新增 `GET /skill-collections`，通过文件系统扫描 + SKILL.md frontmatter 正则解析识别「路由器合集 / 流程合集 / 单点 skill」。
2. **存储**：`marvis_global_skills.json` 仍是扁平字符串数组，**前端**负责把合集展开为所有子 skill 名（含路由器名）后逐个调用现有 enable/disable 接口——**后端 enable/disable 代码零改动**（合集目录 `fs.cpSync({recursive:true})` 已天然整集合生效）。
3. **数据简化**：采用设计文档「简化方案」——不加 `/skill-collections-by-skills` 端点，技能图谱直接用 `/skill-collections` 结果 + `agentSkillIds` 在前端做交叉。

## 前置准备

- [x] 设计文档已批准：`docs/designs/2026-07-09-skill-collections-design.md`
- [x] 确认 `C:\Users\kabuto\.hermes\skills\` 已含 `agent-frameworks/gstack/`、`creative/cheat-on-content/`、`marketing/xinmeiti-huoke/` 三个合集样本
- [ ] 运行 `npm run lint` 与 `npm run build`（即 `tsc -b`）确认当前基线通过
- [ ] 确认 `profile-server`（8645）和 Hermes（8642）当前可访问

## 任务列表

### 任务 1: profile-server 新增 `/skill-collections` 端点 (~5 min)
- **描述**: 在 `profile-server.js` 中新增合集扫描逻辑与 `GET /skill-collections` 路由。遍历 `~/.hermes/skills/` 下所有顶层分类目录（跳过 `.` 开头的元数据目录），对每个分类目录下的 `D/` 用三类规则判定：①有自身 `SKILL.md` 且 frontmatter `name == D.basename` 同时有非隐藏子目录 `c/SKILL.md` → **路由器合集**；②无自身 `SKILL.md` 但有 `c/SKILL.md` 子目录 → **流程合集**；③仅有自身 `SKILL.md` → **单点 skill**。frontmatter 用轻量正则解析（不引入 YAML 库）。
- **文件**:
  - 修改 `scripts/profile-server.js`
- **实现要点**:
  - 新增 `parseSkillFrontmatter(dirPath)` → 读 `SKILL.md`，用 `/^---\s*$([\s\S]*?)^---\s*$/m` 提取 frontmatter 块，再在其中匹配第一个非空 `name:` / `description:` 行；返回 `{ name, description } | null`（读不到或损坏返回 `null`，记 stderr warning 继续扫描）。
  - 新增 `scanSkillCollections()` → 返回 `{ collections: [...], standalones: [...] }`，结构严格匹配设计文档「数据模型」。
  - 路由：在 `/global-skills` 路由附近插入 `if (req.method === 'GET' && url.pathname === '/skill-collections') { json(res, 200, scanSkillCollections()); return; }`。
  - 目录存在性兜底：`~/.hermes/skills/` 不存在时返回 `{ collections: [], standalones: [] }`，不报错。
- **测试**:
  - 启动 `node scripts/profile-server.js`，PowerShell `Invoke-RestMethod http://localhost:8645/skill-collections`。
  - 断言响应含 `collections` 数组，其中 `id` 包含 `gstack`、`cheat-on-content`、`xinmeiti-huoke` 三项。
  - 断言 `gstack` 项有 `router: { name: 'gstack', description: '...' }` 且 `children.length > 0`。
  - 断言 `xinmeiti-huoke` 项 `router === null`（流程合集）。
  - 断言 `standalones` 含 `airtable`、`claude-code`（单点 skill）。
- **验证**:
  - 端口 8645 监听正常，无 stderr 异常退出。
  - 响应 Content-Type 为 `application/json`。
  - 损坏的 SKILL.md 不影响其他目录扫描（手动临时造一个无 frontmatter 的目录验证被跳过）。
- **依赖**: 无

### 任务 2: 新增类型定义 `src/types/skills.ts` + API 函数 (~3 min)
- **描述**: 按设计文档定义合集相关 TS 类型，并在 `src/api/profile.ts` 新增 `getSkillCollections()` 客户端函数。
- **文件**:
  - 创建 `src/types/skills.ts`
  - 修改 `src/api/profile.ts`
- **实现要点**:
  - `src/types/skills.ts` 完整拷贝设计文档中的 4 个接口：`SkillCollectionChild`、`SkillCollection`、`SkillStandalone`、`SkillCollectionsResponse`。注意 `verbatimModuleSyntax`：纯类型文件无需特殊处理。
  - `src/api/profile.ts` 顶部 `import type { SkillCollectionsResponse } from '../types/skills';`，新增：
    ```ts
    export async function getSkillCollections(): Promise<SkillCollectionsResponse> {
      return request('/skill-collections');
    }
    ```
  - 复用现有 `request<T>` 封装（已带 `/profile-api` 前缀与错误处理）。
- **测试**:
  - `npx tsc -b` 通过（严格模式 + `noUnusedLocals`，确保导入被使用）。
- **验证**:
  - 类型字段与后端 `scanSkillCollections()` 返回结构一一对应（`collections[].{id,category,router,children}`、`standalones[].{id,name,description,category}`）。
  - `getSkillCollections` 复用现有错误约定（失败抛 `Error(message)`）。
- **依赖**: 任务 1（验证字段一致，但 TS 编译不依赖后端运行）

### 任务 3: SkillsPage 合集卡片渲染与整集合启停 (~5 min)
- **描述**: 让技能广场并行加载 `/skill-collections`，把合集渲染为带子技能数 badge 的合集卡片；点击一次「启用」即展开为所有子 skill 名（含路由器名）逐个调 `POST /global-skills-enabled/{name}`。
- **文件**:
  - 修改 `src/components/SkillsPage.tsx`
- **实现要点**:
  - 新增 state：`const [collections, setCollections] = useState<SkillCollection[]>([])`、`const [collectionsFailed, setCollectionsFailed] = useState(false)`（用于回退到旧扁平渲染）。
  - `fetchData` 中追加 `Promise.allSettled([..., getSkillCollections()])`；成功写入 `collections`，失败设 `collectionsFailed=true`。
  - derived（`useMemo`）：
    - `collectionChildNameSet` = 所有合集 `children.name` ∪ 合集 `id`（路由器名）的并集。
    - `filteredSkills` 保持现有扁平渲染；**当 `!collectionsFailed && collections.length>0` 时**，从 `filteredSkills` 中减去 `collectionChildNameSet`（避免合集子项被重复当单点卡片渲染），并在前面追加合集卡片列表。
  - 合集卡片样式：左侧 `Folder` 图标（lucide，确认存在）+ 大字号标题 `collection.id` + badge `${children.length} 个子技能` + 分类标签（复用 `categoryLabels[category]`）。合集启用态判断：`collection.children.every(c => added.has(c.name)) && (collection.router ? added.has(collection.router.name) : true)`。
  - 新增 `handleToggleCollection(collection)`：乐观更新 `setAdded`（加/删 router 名 + 所有 children 名）→ `Promise.all` 并发调用每个 name 的 `enableGlobalSkill`/`disableGlobalSkill` → 任一失败则回滚（重新 `getGlobalEnabledSkills()` 拉取真实状态覆盖本地）。
  - 搜索/分类过滤：合集卡片按 `id`/`category`/`router.description` 匹配 `searchQuery` 与 `activeCategory`。
- **测试**:
  - 打开技能广场，搜索 "cheat"：应只看到 1 张 `cheat-on-content` 合集卡片，而非 19 张子卡片。
  - 点合集「启用」：检查 `C:\Users\kabuto\.hermes\marvis_global_skills.json` 是否新增所有 `cheat-*` 子名 + `cheat-on-content`。
  - 再点「禁用」：上述名全部移除。
  - `airtable` 等单点卡片仍正常单独启停。
- **验证**:
  - 合集卡片视觉与单点卡片有区分（folder 图标 + badge）。
  - 乐观更新在网络抖动时正确回滚。
  - `npm run lint` 通过。
- **依赖**: 任务 2

### 任务 4: SkillsTab（技能图谱）合集聚合与 agent 层启停 (~5 min)
- **描述**: 让技能图谱按合集聚合：一张合集卡片 = 一个开关（`enabledForAgent = collection.id ∈ agentSkillIds`）；从扁平 Hermes 技能列表中过滤掉「属于任何被 agent 启用的合集」的子项，避免双显示。
- **文件**:
  - 修改 `src/components/AgentProfileTabs.tsx`（仅 `SkillsTab` 函数，约 166-306 行）
- **实现要点**:
  - `SkillsTab` 内新增 state `collections: SkillCollection[]`、`collectionsFailed: boolean`。
  - `loadGlobalSkills` 的 `Promise.all` 追加 `getSkillCollections()`，失败设 `collectionsFailed=true`，`collections=[]`。
  - `agentSkillIds` 已存在（`new Set(skills.map(s => s.id))`），用于判断 `enabledForAgent`。
  - derived：
    - `visibleCollections` = `collections.filter(c => c.children.some(child => enabledSet.has(child.name)))`（合集至少有一个子技能在全局启用列表中才显示）。
    - 每个合集 `enabledForAgent = agentSkillIds.has(c.id)`。
    - `flatSkills` = 现有 `globalSkills` 减去「属于任何 `enabledForAgent` 合集」的子名（即合集已在 agent 层启用时，其子项不再单列）。
  - 渲染：上半部分 `visibleCollections`（合集卡片 + 整集合开关），下半部分 `flatSkills`（沿用现有 skill 卡片）。合集卡片调用新 `toggleCollection(collection)`：乐观更新 `enabledIds` → `POST/DELETE /{agentId}/skills/{collection.id}`（**用合集 id，后端 `fs.cpSync` 递归拷贝整个合集目录**）→ 失败回滚 → 成功后 `onRefresh('skills')` 重新拉数据。
- **测试**:
  - 打开任一 agent 的「技能图谱」tab，全局启用含 `gstack` 时：应看到一张 `gstack` 合集卡片（带子技能数），而非 50+ 张子技能卡。
  - 对 `gstack` 点开关启用：检查 `~/.hermes/profiles/{agentId}/skills/gstack/SKILL.md` 是否存在。
  - 禁用：该目录被 `rmSync` 移除。
  - `collectionsFailed` 为真时回退到现有扁平渲染（向后兼容，profile-server 8645 down 不阻断）。
- **验证**:
  - 合集启用后其子技能不重复出现在下方「独立 skill」区。
  - `onRefresh('skills')` 后 `agentSkillIds` 刷新，`enabledForAgent` 反映真实状态。
  - `npm run lint` 通过。
- **依赖**: 任务 2

### 任务 5: 最终回归与基线校验 (~2 min)
- **描述**: 全量回归，确认 TypeScript 严格模式、ESLint、单点 skill 流程均未破坏。
- **文件**: 无（只读验证）
- **测试/验证**:
  - `npm run build`（含 `tsc -b`）零错误。
  - `npm run lint` 零警告。
  - 手动验证单点 skill（`airtable`、`claude-code`）在技能广场与技能图谱两处的启停流程与改造前一致。
  - 手动验证 Hermes 网关（8642）关闭时技能广场显示「无法连接 Hermes」，profile-server（8645）关闭时两页面均回退到扁平渲染不崩溃。
- **依赖**: 任务 1、3、4

## 并行机会

- **任务 1（后端）与 任务 2/3/4（前端）可完全并行**：后端是独立 Node 服务文件，前端任务依赖的是「类型契约」而非后端运行时；只要保证字段定义一致即可。
- **任务 3 与 任务 4 可并行**：分别改 `SkillsPage.tsx` 和 `AgentProfileTabs.tsx`，无文件交叉，均只依赖任务 2 的类型/API。

## 风险 & 缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| SKILL.md frontmatter 损坏/格式不一 | 中 | 中 | 正则解析失败返回 `null`，跳过该目录继续扫描，记 stderr warning；不抛错 |
| 合集启用时部分子 skill 接口 5xx | 低 | 高 | 乐观更新 + `Promise.all` 任一失败即回滚（重新拉 `getGlobalEnabledSkills` 真实状态覆盖） |
| profile-server 8645 未运行 | 中 | 中 | 前端 `collectionsFailed` 兜底，两页面均回退现有扁平渲染，向后兼容 |
| `agent-frameworks/gstack` 嵌套过深误判 | 低 | 中 | 扫描只看「分类/D/c」两级深度，深度子目录视为合集内部，不递归识别 |
| Hermes 8642 down 导致 `/v1/skills` 失败 | 中 | 低 | SkillsTab 已有 `getHermesSkills` 失败回退到 `getGlobalSkills` 的双路兜底，无需改动 |

## 测试策略

| 层级 | 内容 | 覆盖目标 |
|------|------|----------|
| 后端单元（手动 curl） | `GET /skill-collections` 三类合集判定、frontmatter 解析、损坏文件跳过 | gstack/cheat-on-content/xinmeiti-huoke + airtable/claude-code |
| 手工集成 | 技能广场合集卡片渲染 + 整集合启停 + `marvis_global_skills.json` 内容核验 | 合集与单点混合场景 |
| 手工集成 | 技能图谱合集聚合 + agent 层启停 + `~/.hermes/profiles/[id]/skills/` 目录核验 | 避免双显示、`onRefresh` 数据一致 |
| 回归 | `npm run build` + `npm run lint` + 单点 skill 旧流程 | 零破坏 |
| 兼容 | 8645 down / 8642 down 分别回退 | 不崩溃、降级可用 |

## 不在范围内（沿用设计文档剔除项）

- 子粒度启用（不能单独启用 `gstack/autoplan`）
- 合集嵌套识别
- Hermes `/v1/skills` API 改造
- `/skill-collections-by-skills` 端点（已选用简化方案）
- profile-server 进程内合集缓存
