# Hermes-Marvis 设置页设计文档

## 目标

在 Hermes-Marvis 前端实现一个与 WSL 中运行的 Hermes Agent 联通的 Web 设置页，支持通过 UI 直接配置 Hermes 的 AI 模型、通用偏好、Agent 参数和系统选项，而无需用户手动编辑 WSL 内的 YAML/ENV 文件。

## 用户场景

1. 用户点击左侧导航栏头像/设置按钮，弹出赛博宫廷风格的设置弹窗。
2. 在 **AI 模式** 中选择首辅调度模型，并从已配置 provider 的模型列表中挑选；点击“配置 provider”打开 provider 弹窗，添加/修改/断开 API key 类 provider。
3. 在 **通用设置** 中切换主题、语言、默认模型、TTS 声音与语调，并勾选各项显示/通知服务。
4. 在 **Agent 配置** 中调整最大并发、Subagent 数量、熔断阈值、心跳间隔、自动恢复、记忆持久化。
5. 在 **系统** 中设置访问密码、官方仪表盘链接、查看网关状态、管理 MCP 服务器。
6. 所有修改即时保存到 WSL 的 Hermes 配置文件中，对新会话生效。

## 技术方案

采用 **扩展 WSL 后端（cron-server.py）** 的方案，原因：
- 复用现有 `cron-server.py` 基础设施（WSL Ubuntu-22.04，端口 8644）。
- 不新增常驻服务，避免与已运行的 Hermes gateway（8642）和 hermes-webui（8787）产生进程耦合。
- Marvis 前端对配置 schema 和 UI 呈现有完全控制权。

后端职责：
- 直接读写 `~/.hermes/config.yaml`（Hermes 主配置）。
- 直接读写 `~/.hermes/.env`（Provider API key / base_url）。
- 读写 `~/.hermes/webui/marvis-settings.json`（Marvis 自有 UI 偏好）。
- 调用 `hermes config check` / `hermes config migrate` 做配置校验与迁移。
- 通过 `subprocess` 或读取 `~/.hermes/gateway_state.json` 获取网关状态。

前端职责：
- 在 `SettingsModal.tsx` 中新增/重构四个功能分区：AI 模式、通用设置、Agent 配置、系统。
- 新增 `src/api/settings.ts` 封装对 `/cron-api/settings/*` 的调用。
- 新增 `ProviderModal.tsx` 实现 provider 连接弹窗。
- 使用现有 Tailwind v4 + Framer Motion 风格，保持赛博宫廷视觉一致。

## 数据模型

### 1. Hermes 配置映射

| Marvis UI 字段 | Hermes `config.yaml` 字段 | 说明 |
|----------------|---------------------------|------|
| 调度模型 | `model.default` + `model.provider` | 写入 `provider/model` 格式 |
| 默认模型 | `model.default` + `model.provider` | 与调度模型共享逻辑 |
| 主题 | `display.skin`（或 Marvis 自有 `theme`） | 先按 Hermes skin 枚举：default / slate / mono / ares 等 |
| 语言 | `display.language` | 如 `zh`, `en` |
| TTS Provider | `tts.provider` | edge / openai / elevenlabs / xai / mistral 等 |
| TTS Voice | `tts.{provider}.voice` 或 `tts.{provider}.voice_id` | 按 provider 变体 |
| TTS 语调 | Marvis 自有 `tts_pitch` | 仅 UI 预览/标记，Hermes 无直接字段 |
| 显示 Token 用量 | `display.show_cost` | bool |
| 隐藏敏感数据 | `security.redact_secrets` | bool |
| 最大并发 | `delegation.max_concurrent_children` | int |
| 首辅 Subagents 数量 | `delegation.max_concurrent_children` | 同一字段，UI 文字区分 |
| 记忆持久化 | `memory.memory_enabled` | bool |
| 官方仪表盘 URL | `dashboard.public_url` | string |

### 2. Marvis 自有偏好（`~/.hermes/webui/marvis-settings.json`）

```json
{
  "theme": "dark",
  "language": "zh",
  "notifications_enabled": false,
  "show_quota_chip": false,
  "show_conversation_outline": false,
  "show_tps": false,
  "fade_text_effect": false,
  "terminal_auto_expand_on_output": false,
  "api_redact_enabled": true,
  "access_password_hash": null,
  "access_password_env_var": false,
  "auto_recovery_enabled": true,
  "circuit_breaker_threshold": 3,
  "heartbeat_interval_seconds": 30
}
```

字段与官方 `hermes-webui` 的 `settings.json` 语义对齐，但隔离在 `marvis-settings.json` 中，避免冲突。

### 3. Provider 凭据（`~/.hermes/.env`）

每个 API key 类 provider 对应一个或多个 env var：

| Provider | API Key Env | Base URL Env |
|----------|-------------|--------------|
| OpenAI | `OPENAI_API_KEY` | `OPENAI_BASE_URL` |
| Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_BASE_URL` |
| OpenRouter | `OPENROUTER_API_KEY` | - |
| Google/Gemini | `GOOGLE_API_KEY` / `GEMINI_API_KEY` | `GEMINI_BASE_URL` |
| DeepSeek | `DEEPSEEK_API_KEY` | `DEEPSEEK_BASE_URL` |
| MiniMax (国际) | `MINIMAX_API_KEY` | `MINIMAX_BASE_URL` |
| MiniMax (中国) | `MINIMAX_CN_API_KEY` | `MINIMAX_CN_BASE_URL` |
| Kimi | `KIMI_API_KEY` | `KIMI_BASE_URL` |
| Z.AI / GLM | `GLM_API_KEY` / `ZAI_API_KEY` | `GLM_BASE_URL` |
| xAI | `XAI_API_KEY` | `XAI_BASE_URL` |
| NVIDIA | `NVIDIA_API_KEY` | `NVIDIA_BASE_URL` |
| LM Studio | `LM_API_KEY` | `LM_BASE_URL` |
| StepFun | `STEPFUN_API_KEY` | `STEPFUN_BASE_URL` |
| Arcee | `ARCEEAI_API_KEY` | `ARCEE_BASE_URL` |
| GMI Cloud | `GMI_API_KEY` | `GMI_BASE_URL` |

已连接 provider 列表通过扫描 `.env` 中 `*_API_KEY` 是否存在得出。Provider 元数据从 Hermes 源码 `hermes_cli.config.OPTIONAL_ENV_VARS` 提取（category=provider，advanced 控制是否默认折叠）。

## 接口设计

后端新增以下端点，统一挂载在 `cron-server.py` 下。

### 1. 设置总览

```
GET /cron-api/settings
```

返回：

```json
{
  "config": { /* 过滤后的 config.yaml 子集 */ },
  "marvis": { /* marvis-settings.json 内容 */ },
  "providers": {
    "configured": [{ "id": "minimax-cn", "name": "MiniMax (China)", "key_env": "MINIMAX_CN_API_KEY" }],
    "available": [{ "id": "openai", "name": "OpenAI", "key_env": "OPENAI_API_KEY", "base_url_env": "OPENAI_BASE_URL", "docs_url": "..." }]
  }
}
```

### 2. Hermes 配置更新

```
PUT /cron-api/settings/config
Body: { "path": "model.default", "value": "MiniMax-M3" }
```

或批量：

```
PUT /cron-api/settings/config/batch
Body: { "model.default": "MiniMax-M3", "display.language": "zh" }
```

后端使用 YAML 安全更新并保留注释（优先用 `ruamel.yaml`；若不可用则 `PyYAML` 并提醒注释会丢失）。保存前调用 `hermes config check` 校验。

### 3. Marvis 偏好更新

```
PUT /cron-api/settings/marvis
Body: { "show_tps": true }
```

直接合并写入 `marvis-settings.json`。

### 4. Provider 管理

```
GET    /cron-api/settings/providers          # 列出所有 API key 类 provider 元数据
POST   /cron-api/settings/providers/connect  # { provider, api_key, base_url? }
POST   /cron-api/settings/providers/test     # { provider, api_key, base_url? }
DELETE /cron-api/settings/providers/:id      # 断开：删除对应 env var
```

写入 `.env` 时使用 `save_env_value` 等价逻辑：追加或覆盖，不破坏其他变量。

测试接口复刻 Hermes WebUI 的探测逻辑：
- `OPENAI_BASE_URL` 类：GET `{base_url}/models` 验证可达。
- `OPENROUTER_API_KEY`：GET `https://openrouter.ai/api/v1/key` Bearer。
- `OPENAI_API_KEY`：GET `https://api.openai.com/v1/models` Bearer。
- `XAI_API_KEY`：GET `https://api.x.ai/v1/models` Bearer。
- `GEMINI_API_KEY`：GET `https://generativelanguage.googleapis.com/v1beta/models?key=...`。
- 其余无 probe 的 provider：返回 `ok=true, reachable=false`，允许保存。

### 5. 模型列表

```
GET /cron-api/settings/models?provider=minimax-cn
```

优先调用 Hermes 内部的 `provider_model_ids(provider)`（若可通过 sys.path import）；否则返回预置兜底列表或空数组，并提示用户手动输入。

### 6. 网关状态

```
GET /cron-api/settings/gateway
```

读取 `~/.hermes/gateway_state.json` 或调用 `hermes gateway status` 子命令，返回各平台（Telegram/Discord/Slack/WhatsApp 等）的 connected/configured 状态。

### 7. MCP 服务器

```
GET    /cron-api/settings/mcp
POST   /cron-api/settings/mcp
PUT    /cron-api/settings/mcp/:name
DELETE /cron-api/settings/mcp/:name
POST   /cron-api/settings/mcp/:name/test
PUT    /cron-api/settings/mcp/:name/enabled
```

直接读写 `config.yaml` 中的 `mcp_servers` 块（若 Hermes 使用其他键名，实现时读取 `hermes_cli.mcp_config._get_mcp_servers` 的实际路径）。

### 8. 访问密码

```
PUT /cron-api/settings/password
Body: { "password": "new-password" }  # 或 "" 清除
```

写入 `marvis-settings.json` 的 `access_password_hash`（PBKDF2-HMAC-SHA256），并设置 `access_password_env_var=false`。实际认证由 Marvis 前端在打开设置弹窗前校验（简单场景下可先在 UI 层实现）。

## 错误处理

| 失败场景 | 处理策略 |
|----------|----------|
| WSL 后端不可达 | 前端显示“无法连接 WSL 设置服务”，禁用保存按钮 |
| `config.yaml` 写入失败 | 返回 500 + 错误详情，前端回滚本地状态 |
| `hermes config check` 报错 | 返回 400 + 校验信息，前端高亮问题字段 |
| Provider key 验证失败 | 弹窗显示警告，但允许用户强制保存 |
| `.env` 写权限不足 | 返回 500，提示检查 `~/.hermes/.env` 权限 |
| MCP 测试超时 | 返回 `reachable: false`，不阻断保存 |
| 并发写冲突 | 后端对 `config.yaml` 和 `.env` 加文件锁，失败时返回 423 |

## 测试策略

1. **后端单元测试**：在 WSL 中用临时目录模拟 `HERMES_HOME`，测试 `config.yaml`、`.env`、`marvis-settings.json` 的读写与校验。
2. **接口契约测试**：用 `curl` 验证 `GET/PUT /cron-api/settings/config`、`/providers/connect`、`/mcp` 的往返数据。
3. **前端类型测试**：运行 `npm run build` 通过 TypeScript 严格检查；`npm run lint` 无新增错误。
4. **集成测试**：
   - 修改设置后，在 WSL 中运行 `hermes config show` 确认字段已更新。
   - 添加 MiniMax CN key 后，确认 `.env` 中 `MINIMAX_CN_API_KEY` 已写入。
5. **手动走查**：provider 弹窗连接/断开/测试、各设置项保存后刷新页面保持、网关状态展示。

## 待执行时进一步确认

- `mcp_servers` 在 `config.yaml` 中的实际键名（需查看 `hermes_cli.mcp_config` 实现）。
- 用户提到的“熔断阈值”“心跳间隔”若需映射到 Hermes 原生字段，需从 `hermes_cli.config.DEFAULT_CONFIG` 中挑选最接近项；当前设计先作为 Marvis 自有偏好实现。
- 主题字段是映射到 `display.skin` 还是引入独立的 `theme`；实现前再与用户确认一次。

## 依赖与约束

- WSL Ubuntu-22.04 必须可访问，且 `hermes` CLI 在 `~/.local/bin/hermes` 可用。
- `cron-server.py` 需要 `PyYAML` 或 `ruamel.yaml` 来安全编辑 YAML。
- 前端继续使用现有 Vite proxy：`/cron-api` → `localhost:8644`。
- 不引入新 npm 依赖；UI 复用 lucide-react + Framer Motion。
