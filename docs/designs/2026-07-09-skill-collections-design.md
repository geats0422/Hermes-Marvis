# Skill Collections 设计文档

## 目标

解决「技能广场」和「技能图谱」将合集型 skill（如 `gstack`、`cheat-on-content`、`xinmeiti-huoke`）误作为单卡片渲染的问题。合集应该作为带子技能列表的合集卡片渲染，启用语义为整集合一次性启用。

## 用户场景

### 1. 技能广场（`SkillsPage.tsx`）

- **现状**：用户在分类标签下搜索 "cheat"，看到 19 张独立的 `cheat-*` 子技能卡片。每个都要单独点「启用」。
- **目标**：看到一张 `cheat-on-content` 合集卡片（带 `19 个子技能 · 创意` 标签）。点击展开/路由查看子列表（只读预览），点一次「启用」即代表启用全部。
- **单点 skill 不变**：`airtable`、`claude-code` 等仍是单卡片。

### 2. 技能图谱（`AgentProfileTabs.tsx` SkillsTab）

- **现状**：技能图谱展示 Hermes 的扁平列表，过滤为全局启用的所有 skill。一个 `gstack` 集合展开后会出现 50+ 个 gstack 子技能（因为它们都在全局启用列表中），需要逐个打开开关。
- **目标**：技能图谱也按合集聚合。一张 `gstack` 合集卡片 = 一个开关。整集合「已为该 agent 启用」/「未启用」。

## 技术方案

### 合集检测（profile-server 新增 `/skill-collections`）

`profile-server` 通过文件系统扫描识别合集。**不**依赖 Hermes `/v1/skills` API（其返回扁平列表，不带路径信息）。

扫描逻辑：
1. 遍历 `~/.hermes/skills/` 下所有顶层分类目录（如 `agent-frameworks/`、`creative/`、`marketing/`），跳过以 `.` 开头的元数据目录（`.hub`、`.curator_backups` 等）。
2. 对每个分类目录下的 `D/`：
   - **`has_own_skill_md(D)`**：`D/SKILL.md` 存在 → 进一步读取 frontmatter 的 `name` 字段
   - **`has_skill_md_children(D)`**：`D/` 下存在 **非隐藏** 的子目录 `c/`，且 `c/SKILL.md` 存在
3. 判定类型：

| 条件 | 类型 | 例子 |
|---|---|---|
| `has_own_skill_md(D)` && `has_skill_md_children(D)` && SKILL.md frontmatter `name == D.basename` | **路由器合集** | `agent-frameworks/gstack/`, `creative/cheat-on-content/` |
| `!has_own_skill_md(D)` && `has_skill_md_children(D)` | **流程合集** | `marketing/xinmeiti-huoke/` |
| `has_own_skill_md(D)` && `!has_skill_md_children(D)` | **单点 skill** | `airtable/`, `claude-code/` |
| 其他 | **忽略** | `templates/`、`examples/` 等 |

4. SKILL.md frontmatter 解析（轻量正则，避免引入 YAML 库）：

```
/^---\s*$([\s\S]*?)^---\s*$/
name:\s*([^\n]+)
description:\s*([^\n]+)
```

第一次非空 `name:` 与 `description:` 行。

### 数据模型

```jsonc
// GET /skill-collections 响应
{
  "collections": [
    {
      "id": "gstack",                                  // 顶层目录 basename
      "category": "agent-frameworks",                   // 一级分类
      "router": {                                       // 路由器合集才有；流程合集为 null
        "name": "gstack",
        "description": "Router for the gstack skill suite."
      },
      "children": [
        { "name": "autoplan", "description": "..." },
        { "name": "benchmark", "description": "..." }
      ]
    }
  ],
  "standalones": [
    { "id": "airtable", "name": "airtable", "description": "...", "category": "data-science" }
  ]
}
```

**存储策略**：`marvis_global_skills.json` 仍存为扁平名数组。合集启用时，**前端**展开为所有子 skill 名（含路由器名如果有），逐个调 `POST /global-skills-enabled/{skillId}`。这样 `SkillsTab` 现有的 `s => enabledSet.has(s.name)` 滤波逻辑无需改动。

**好处**：
- 数据模型最简单（仍是字符串数组）
- 现有 AgentProfileTabs 几乎不动
- 用户能在启用合集的同时，看到子技能是否已经在 marvis_global_skills 里

### 启用接口（无改动）

现有 `profile-server.js` 的 `POST /[agentId]/skills/[skillId]`：
```js
fs.cpSync(globalSkillDir, target, { recursive: true })
```
当 `skillId == 'gstack'` 时，`globalSkillDir = ~/.hermes/skills/agent-frameworks/gstack`，该目录本身已嵌套所有子 skill，一次性递归拷贝即整集合生效。**不用改任何 enable/disable 代码。**

## 接口设计

### `GET /skill-collections`（新）

- 协议：`profile-server` HTTP 端点
- 路径：`GET http://localhost:8645/skill-collections`
- 响应：见上「数据模型」
- 失败：返回 `500 { "error": "message" }`

### `GET /skill-collections-by-skills`（新，技能图谱专用）

基于已有 Hermes 技能列表过滤出哪些属于合集：

- 路径：`GET http://localhost:8645/skill-collections-by-skills?skills=name1,name2,...`
- 响应：
  ```json
  {
    "collections": [
      {
        "id": "gstack",
        "category": "agent-frameworks",
        "router": { "name": "gstack", "description": "..." },
        "children": [...],
        "enabled_for_agent": true   // 来自调用方传入的 enabledSkillIds
      }
    ]
  }
  ```
- 调用方传 `enabledSkillIds` (此 agent 的 `~/.hermes/profiles/[id]/skills/` 下的顶层 id)，后端计算哪些合集根目录存在于其中。

> 或者更简单的实现：把 `agentSkillIds` 已在 `SkillsTab` 中，直接在前端用 `/skill-collections` 的结果和 `agentSkillIds` 做交叉。**当前设计选这个简化方案**——不再额外加端点。

### 现有接口保持不变

- `GET /v1/skills`（Hermes）
- `GET /global-skills-enabled` / `POST /global-skills-enabled/[id]` / `DELETE /global-skills-enabled/[id]`（profile-server）
- `GET /[agentId]/skills` / `POST /[agentId]/skills/[skillId]` / `DELETE /[agentId]/skills/[skillId]`（profile-server）

## 组件交互

### `SkillsPage.tsx`（技能广场）

```
加载流程：
  1. 并行: GET /skill-collections + GET /v1/skills + GET /global-skills-enabled
  2. derived:
       - collectionEnabledIds = 全局启用的名 ∩ 所有合集子技能 ∪ 合集 ID 的并集
       - collectionMap = Map<collectionId, collection>
       - standaloneEnabledIds = 全局启用的名 - 合集子技能 - 合集 ID
  3. 渲染：
       - 合集卡片（router/collection 样式：左侧文件夹图标 + 大字号标题 + 子技能数 badge）
       - 单点卡片（沿用现有样式）
  4. 搜索/分类：仅匹配合集 ID / 名 / 描述 / category

用户交互：
  启用合集（点击 +启用）：
    1. 乐观更新：本地 setAdded += collection.children.map(c => c.name) + collection.router?.name
    2. 对每个 name 调 POST /global-skills-enabled/{name}
    3. 失败回滚（撤掉勾）
  禁用合集（点击已启用）：
    同上，对每个 name 调 DELETE
```

### `AgentProfileTabs.tsx` `SkillsTab`（技能图谱）

```
加载流程：
  1. 并行: GET /v1/skills + GET /global-skills-enabled + GET /skill-collections
  2. derivation:
       - collectionsToShow: collection.children 名 ∩ enabledSet 非空者（即可见）
       - 每个 collection 加一个 Boolean 字段 enabledForAgent = collection.id ∈ agentSkillIds
         （agentSkillIds = props.skills[].id，来自 ~/.hermes/profiles/[id]/skills/ 的目录名）
       - 仍可见的 flat Hermes skills 中，过滤掉「属于任何被启用的合集」的子项，避免双显示
  3. 渲染：上半部分合集卡片 + 下半部分独立子技能卡片

用户交互：
  合集启用（agent 层）：
    1. 乐观更新：enabledForAgent = true
    2. POST /[agentId]/skills/gstack
    3. props.onRefresh('skills') 重新拉数据
  合集禁用：
    DELETE /[agentId]/skills/gstack
```

### 类型定义（`src/types/skills.ts`，新文件）

```ts
export interface SkillCollectionChild {
  name: string;
  description: string;
}

export interface SkillCollection {
  id: string;
  category: string | null;  // null when the collection sits at the skills/ root (rare)
  router: SkillCollectionChild | null;
  children: SkillCollectionChild[];
}

export interface SkillStandalone {
  id: string;
  name: string;
  description: string;
  category: string | null;
}

export interface SkillCollectionsResponse {
  collections: SkillCollection[];
  standalones: SkillStandalone[];
}
```

### API 函数（`src/api/profile.ts` 新增）

```ts
export async function getSkillCollections(): Promise<SkillCollectionsResponse> {
  const data = await request<SkillCollectionsResponse>('/skill-collections');
  return data;
}
```

## 错误处理

| 失败模式 | 处理 |
|---|---|
| Hermes 网关未运行（8642 down） | `getSkills()` 失败 → SkillsPage/技能图谱回退显示「无法同步 Hermes」 |
| profile-server 未运行（8645 down） | `getSkillCollections()` 失败 → SkillsPage 整体回退到旧版扁平渲染（向后兼容） |
| `.skill-collections` 扫描遇到损坏 SKILL.md | 跳过该目录，继续扫描其他，记录 warning 到 stderr |
| 启用合集时部分子技能接口失败 | 乐观更新回滚（整个合集撤回 enabled） |

## 测试策略

1. **后端单元测试**（手动 curl）：
   - `GET /skill-collections` → 期待返回结构化数据，含 `gstack`, `cheat-on-content`, `xinmeiti-huoke` 三个合集
2. **手工集成测试**：
   - SkillsPage 看到合集卡片
   - 点启用 → marvis_global_skills.json 中出现所有子 skill 名
   - 关闭 agent 详情面板，在技能图谱看到合集卡片 + 子技能不在「独立 skill」区域重复显示
   - 在技能图谱对 `gstack` 启用 → `~/.hermes/profiles/[id]/skills/gstack/SKILL.md` 存在
3. **回归测试**：
   - `npm run build` 通过（TypeScript 严格模式）
   - `npm run lint` 通过
   - 单点 skill（`airtable` 等）启用流程未破坏

## 不在范围内（明确剔除）

- 子粒度启用（用户不能单独启用 `gstack/autoplan` 而不启用其他）
- 合集嵌套（`gstack/openclaw/skills/` 等深度路径视为合集内子目录，不当作独立合集）
- Hermes `/v1/skills` API 改造（保持向后兼容）
- 跨 profile-server 进程的合集缓存（首次每次扫描）
