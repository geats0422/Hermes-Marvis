"""
Hermes Cron + System + Settings HTTP Service
Wraps hermes CLI and exposes system/WSL/Hermes config to the Marvis frontend.

Endpoints:
  GET    /cron-api/jobs              List all jobs
  POST   /cron-api/jobs              Create a job
  PATCH  /cron-api/jobs/:id          Edit a job
  POST   /cron-api/jobs/:id/pause    Pause
  POST   /cron-api/jobs/:id/resume   Resume
  POST   /cron-api/jobs/:id/run      Trigger now
  DELETE /cron-api/jobs/:id          Remove
  GET    /cron-api/status            Scheduler status

  GET    /cron-api/system/drives     Windows physical drives
  GET    /cron-api/system/wsl        WSL2 distros list
  GET    /cron-api/system/wsl-fs     WSL filesystem usage

  GET    /cron-api/settings           Full settings overview
  GET    /cron-api/settings/config    Hermes config.yaml (filtered)
  PUT    /cron-api/settings/config    Update config.yaml field(s)
  GET    /cron-api/settings/marvis    Marvis UI preferences
  PUT    /cron-api/settings/marvis    Update Marvis preferences
  GET    /cron-api/settings/providers List all API-key providers
  POST   /cron-api/settings/providers/connect   Connect a provider
  POST   /cron-api/settings/providers/test      Test a provider key
  DELETE /cron-api/settings/providers/:id        Disconnect a provider
  GET    /cron-api/settings/gateway   Gateway status
  GET    /cron-api/settings/mcp       MCP servers list
  POST   /cron-api/settings/mcp       Add MCP server
  PUT    /cron-api/settings/mcp/:name Update MCP server
  DELETE /cron-api/settings/mcp/:name Delete MCP server
"""

import http.server
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
from urllib.parse import urlparse, parse_qs

import yaml

PORT = 8644
HERMES = os.path.expanduser("~/.local/bin/hermes")
HOME = os.path.expanduser("~")
HERMES_HOME = os.path.expanduser("~/.hermes")
CONFIG_PATH = os.path.join(HERMES_HOME, "config.yaml")
ENV_PATH = os.path.join(HERMES_HOME, ".env")
MARVIS_SETTINGS_PATH = os.path.join(HERMES_HOME, "webui", "marvis-settings.json")
GATEWAY_STATE_PATH = os.path.join(HERMES_HOME, "gateway_state.json")
API_KEY = os.environ.get("VITE_CRON_API_KEY", "")

_config_lock = threading.Lock()
_env_lock = threading.Lock()
_marvis_lock = threading.Lock()

MARVIS_SETTINGS_DEFAULTS = {
    "theme": "dark",
    "language": "zh",
    "notifications_enabled": False,
    "show_quota_chip": False,
    "show_conversation_outline": False,
    "show_tps": False,
    "fade_text_effect": False,
    "terminal_auto_expand_on_output": False,
    "api_redact_enabled": True,
    "access_password_hash": None,
    "auto_recovery_enabled": True,
    "circuit_breaker_threshold": 3,
    "heartbeat_interval_seconds": 30,
}

PROVIDER_CATALOG = [
    {"id": "openai", "name": "OpenAI", "key_env": "OPENAI_API_KEY", "base_url_env": "OPENAI_BASE_URL", "docs_url": "https://platform.openai.com/api-keys"},
    {"id": "anthropic", "name": "Anthropic", "key_env": "ANTHROPIC_API_KEY", "base_url_env": "ANTHROPIC_BASE_URL", "docs_url": "https://console.anthropic.com/"},
    {"id": "openrouter", "name": "OpenRouter", "key_env": "OPENROUTER_API_KEY", "base_url_env": None, "docs_url": "https://openrouter.ai/keys"},
    {"id": "google", "name": "Google AI Studio", "key_env": "GOOGLE_API_KEY", "base_url_env": "GEMINI_BASE_URL", "docs_url": "https://aistudio.google.com/app/apikey"},
    {"id": "gemini", "name": "Gemini", "key_env": "GEMINI_API_KEY", "base_url_env": "GEMINI_BASE_URL", "docs_url": "https://aistudio.google.com/app/apikey"},
    {"id": "deepseek", "name": "DeepSeek", "key_env": "DEEPSEEK_API_KEY", "base_url_env": "DEEPSEEK_BASE_URL", "docs_url": "https://platform.deepseek.com/api_keys"},
    {"id": "minimax", "name": "MiniMax", "key_env": "MINIMAX_API_KEY", "base_url_env": "MINIMAX_BASE_URL", "docs_url": "https://www.minimax.io/"},
    {"id": "minimax-cn", "name": "MiniMax (China)", "key_env": "MINIMAX_CN_API_KEY", "base_url_env": "MINIMAX_CN_BASE_URL", "docs_url": "https://www.minimaxi.com/"},
    {"id": "xai", "name": "xAI Grok", "key_env": "XAI_API_KEY", "base_url_env": "XAI_BASE_URL", "docs_url": "https://console.x.ai/"},
    {"id": "nvidia", "name": "NVIDIA NIM", "key_env": "NVIDIA_API_KEY", "base_url_env": "NVIDIA_BASE_URL", "docs_url": "https://build.nvidia.com/"},
    {"id": "lmstudio", "name": "LM Studio", "key_env": "LM_API_KEY", "base_url_env": "LM_BASE_URL", "docs_url": None},
    {"id": "glm", "name": "Z.AI / GLM", "key_env": "GLM_API_KEY", "base_url_env": "GLM_BASE_URL", "docs_url": "https://z.ai/"},
    {"id": "kimi", "name": "Kimi / Moonshot", "key_env": "KIMI_API_KEY", "base_url_env": "KIMI_BASE_URL", "docs_url": "https://platform.moonshot.cn/"},
    {"id": "kimi-cn", "name": "Kimi (China)", "key_env": "KIMI_CN_API_KEY", "base_url_env": None, "docs_url": "https://platform.moonshot.cn/"},
    {"id": "stepfun", "name": "StepFun", "key_env": "STEPFUN_API_KEY", "base_url_env": "STEPFUN_BASE_URL", "docs_url": "https://platform.stepfun.com/"},
    {"id": "arcee", "name": "Arcee AI", "key_env": "ARCEEAI_API_KEY", "base_url_env": "ARCEE_BASE_URL", "docs_url": "https://chat.arcee.ai/"},
    {"id": "gmi", "name": "GMI Cloud", "key_env": "GMI_API_KEY", "base_url_env": "GMI_BASE_URL", "docs_url": "https://www.gmicloud.ai/"},
]

CREDENTIAL_PROBES = {
    "OPENROUTER_API_KEY": ("https://openrouter.ai/api/v1/key", "bearer"),
    "OPENAI_API_KEY": ("https://api.openai.com/v1/models", "bearer"),
    "XAI_API_KEY": ("https://api.x.ai/v1/models", "bearer"),
    "GEMINI_API_KEY": ("https://generativelanguage.googleapis.com/v1beta/models", "query"),
    "GOOGLE_API_KEY": ("https://generativelanguage.googleapis.com/v1beta/models", "query"),
}

CONFIG_EXPOSE_KEYS = {
    "model", "display", "tts", "voice", "security", "delegation", "agent",
    "memory", "dashboard", "streaming", "cron", "kanban", "display",
    "tool_loop_guardrails", "sessions", "browser", "web", "context",
}

SKIN_OPTIONS = [
    "default", "ares", "mono", "slate", "poseidon", "sisyphus",
    "charizard", "sienna", "catppuccin", "nous", "geist-contrast",
]

TTS_PROVIDERS = ["edge", "openai", "elevenlabs", "xai", "mistral", "neutts", "piper"]

TTS_VOICES = {
    "edge": [
        "en-US-AriaNeural", "en-US-DavisNeural", "en-US-JennyNeural",
        "zh-CN-XiaoxiaoNeural", "zh-CN-YunxiNeural", "zh-CN-XiaoyiNeural",
        "ja-JP-NanamiNeural", "ko-KR-SunHiNeural",
    ],
    "openai": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
    "elevenlabs": ["pNInz6obpgDQGcFmaJgB", "21m00Tcm4TlvDq8ikWAM", "AZnzlk1XvdvUeBnXmlld"],
    "xai": ["eve"],
}


def _detach():
    if hasattr(os, "setsid"):
        os.setsid()


def run_hermes(*args, timeout=30):
    try:
        result = subprocess.run(
            [HERMES, "cron", *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "HOME": HOME},
        )
        return {
            "ok": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "timeout"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def list_jobs():
    path = os.path.expanduser("~/.hermes/cron/jobs.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"jobs": [], "updated_at": None}
    except Exception as e:
        return {"error": str(e)}


def create_job(payload):
    name = payload.get("name", "").strip()
    prompt = payload.get("prompt", "").strip()
    schedule = payload.get("schedule", "").strip()
    deliver = payload.get("deliver", "local")
    repeat = payload.get("repeat")
    skills = payload.get("skills") or []

    if not schedule or not prompt:
        return {"ok": False, "error": "schedule \u548c prompt \u5fc5\u586b"}

    args = ["create", schedule, prompt]
    if name:
        args.extend(["--name", name])
    if deliver and deliver != "origin":
        args.extend(["--deliver", deliver])
    if repeat:
        args.extend(["--repeat", str(repeat)])
    for s in skills:
        args.extend(["--skill", s])

    return run_hermes(*args)


def edit_job(job_id, payload):
    args = ["edit", job_id]
    if "name" in payload and payload["name"]:
        args.extend(["--name", payload["name"]])
    if "prompt" in payload and payload["prompt"]:
        args.extend(["--prompt", payload["prompt"]])
    if "schedule" in payload and payload["schedule"]:
        args.extend(["--schedule", payload["schedule"]])
    return run_hermes(*args)


def run_action(job_id, action):
    return run_hermes(action, job_id)


def _redact(value):
    if not value or len(value) < 8:
        return "***"
    return value[:4] + "..." + value[-4:]


def _deep_get(cfg, dotted):
    parts = dotted.split(".")
    cur = cfg
    for p in parts:
        if isinstance(cur, dict):
            cur = cur.get(p)
        else:
            return None
    return cur


def _deep_set(cfg, dotted, value):
    parts = dotted.split(".")
    cur = cfg
    for p in parts[:-1]:
        if p not in cur or not isinstance(cur[p], dict):
            cur[p] = {}
        cur = cur[p]
    cur[parts[-1]] = value


def load_hermes_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        return {}
    except Exception:
        return {}


def save_hermes_config(cfg):
    with _config_lock:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True, sort_keys=False)


def filter_config_for_client(cfg):
    return {k: v for k, v in cfg.items() if k in CONFIG_EXPOSE_KEYS}


def load_env_file():
    env = {}
    try:
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    except FileNotFoundError:
        pass
    return env


def save_env_value(key, value):
    with _env_lock:
        env = load_env_file()
        env[key] = value
        lines = [f"{k}={v}" for k, v in env.items()]
        with open(ENV_PATH, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")


def remove_env_value(key):
    with _env_lock:
        env = load_env_file()
        if key in env:
            del env[key]
            lines = [f"{k}={v}" for k, v in env.items()]
            with open(ENV_PATH, "w", encoding="utf-8") as f:
                f.write("\n".join(lines) + "\n")
            return True
        return False


def load_marvis_settings():
    defaults = dict(MARVIS_SETTINGS_DEFAULTS)
    try:
        with open(MARVIS_SETTINGS_PATH, "r", encoding="utf-8") as f:
            stored = json.load(f)
            defaults.update(stored)
    except FileNotFoundError:
        pass
    except Exception:
        pass
    return defaults


def save_marvis_settings(settings):
    with _marvis_lock:
        os.makedirs(os.path.dirname(MARVIS_SETTINGS_PATH), exist_ok=True)
        current = load_marvis_settings()
        for k, v in settings.items():
            if k in MARVIS_SETTINGS_DEFAULTS:
                current[k] = v
        with open(MARVIS_SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
        return current


def get_providers_status():
    env = load_env_file()
    configured = []
    available = []
    for p in PROVIDER_CATALOG:
        key_val = env.get(p["key_env"], "")
        entry = {
            "id": p["id"],
            "name": p["name"],
            "key_env": p["key_env"],
            "base_url_env": p.get("base_url_env"),
            "docs_url": p.get("docs_url"),
            "configured": bool(key_val),
            "redacted_key": _redact(key_val) if key_val else None,
            "base_url": env.get(p["base_url_env"], "") if p.get("base_url_env") else None,
        }
        if entry["configured"]:
            configured.append(entry)
        available.append(entry)
    return {"configured": configured, "available": available}


def test_provider(provider_id, api_key, base_url=None):
    import urllib.request
    import urllib.error
    cat = next((p for p in PROVIDER_CATALOG if p["id"] == provider_id), None)
    if not cat:
        return {"ok": False, "reachable": False, "message": f"Unknown provider: {provider_id}"}
    key_env = cat["key_env"]
    if key_env == "LM_API_KEY" or (base_url and "localhost" in base_url) or (base_url and "127.0.0.1" in base_url):
        url = (base_url or "http://localhost:1234").rstrip("/") + "/v1/models"
        try:
            req = urllib.request.Request(url, method="GET")
            urllib.request.urlopen(req, timeout=8)
            return {"ok": True, "reachable": True, "message": ""}
        except Exception:
            return {"ok": False, "reachable": False, "message": f"Could not reach {url}"}
    if key_env in CREDENTIAL_PROBES:
        probe_url, auth_method = CREDENTIAL_PROBES[key_env]
        try:
            headers = {"Accept": "application/json"}
            if auth_method == "bearer":
                headers["Authorization"] = f"Bearer {api_key}"
                req = urllib.request.Request(probe_url, headers=headers, method="GET")
            else:
                sep = "&" if "?" in probe_url else "?"
                req = urllib.request.Request(f"{probe_url}{sep}key={api_key}", headers=headers, method="GET")
            urllib.request.urlopen(req, timeout=10)
            return {"ok": True, "reachable": True, "message": ""}
        except urllib.error.HTTPError as e:
            if e.code == 401:
                return {"ok": False, "reachable": True, "message": "Invalid API key"}
            return {"ok": True, "reachable": True, "message": ""}
        except Exception as e:
            return {"ok": False, "reachable": False, "message": str(e)}
    return {"ok": True, "reachable": False, "message": "No probe for this provider"}


def connect_provider(provider_id, api_key, base_url=None):
    cat = next((p for p in PROVIDER_CATALOG if p["id"] == provider_id), None)
    if not cat:
        return {"ok": False, "error": f"Unknown provider: {provider_id}"}
    save_env_value(cat["key_env"], api_key)
    if base_url and cat.get("base_url_env"):
        save_env_value(cat["base_url_env"], base_url)
    return {"ok": True, "provider": provider_id}


def disconnect_provider(provider_id):
    cat = next((p for p in PROVIDER_CATALOG if p["id"] == provider_id), None)
    if not cat:
        return {"ok": False, "error": f"Unknown provider: {provider_id}"}
    removed = remove_env_value(cat["key_env"])
    if cat.get("base_url_env"):
        remove_env_value(cat["base_url_env"])
    return {"ok": removed, "provider": provider_id}


def get_gateway_status():
    try:
        with open(GATEWAY_STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"running": False, "platforms": {}}
    except Exception as e:
        return {"error": str(e)}


def get_mcp_servers():
    cfg = load_hermes_config()
    return cfg.get("mcp_servers", {})


def _save_mcp_servers(servers):
    cfg = load_hermes_config()
    cfg["mcp_servers"] = servers
    save_hermes_config(cfg)


def add_mcp_server(name, config):
    servers = get_mcp_servers()
    servers[name] = config
    _save_mcp_servers(servers)
    return {"ok": True, "name": name}


def update_mcp_server(name, config):
    servers = get_mcp_servers()
    if name not in servers:
        return {"ok": False, "error": f"MCP server '{name}' not found"}
    servers[name].update(config)
    _save_mcp_servers(servers)
    return {"ok": True, "name": name}


def delete_mcp_server(name):
    servers = get_mcp_servers()
    if name not in servers:
        return {"ok": False, "error": f"MCP server '{name}' not found"}
    del servers[name]
    _save_mcp_servers(servers)
    return {"ok": True, "name": name}


def get_settings_overview():
    cfg = load_hermes_config()
    marvis = load_marvis_settings()
    providers = get_providers_status()
    return {
        "config": filter_config_for_client(cfg),
        "marvis": marvis,
        "providers": providers,
        "gateway": get_gateway_status(),
        "mcp_servers": get_mcp_servers(),
        "skin_options": SKIN_OPTIONS,
        "tts_providers": TTS_PROVIDERS,
        "tts_voices": TTS_VOICES,
    }


def list_windows_drives():
    try:
        ps_script = "\n".join([
            "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8",
            "$vols = Get-Volume | Where-Object {$_.DriveLetter}",
            "$vols | ForEach-Object {",
            "  $used = $_.Size - $_.SizeRemaining",
            "  [PSCustomObject]@{",
            "    Letter=$_.DriveLetter.ToString()+':'",
            "    Label=if($_.FileSystemLabel){$_.FileSystemLabel}else{''}",
            "    UsedGB=[math]::Round($used/1GB,1)",
            "    TotalGB=[math]::Round($_.Size/1GB,1)",
            "    FreeGB=[math]::Round($_.SizeRemaining/1GB,1)",
            "    Health=$_.HealthStatus.ToString()",
            "  }",
            "} | ConvertTo-Json -Compress",
        ])
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", ps_script],
            capture_output=True, timeout=20,
            preexec_fn=_detach,
        )
        if result.returncode != 0 or not result.stdout:
            return []
        try:
            text = result.stdout.decode("utf-8", errors="replace")
        except Exception:
            text = result.stdout.decode("gbk", errors="replace")
        text = text.strip()
        if not text:
            return []
        data = json.loads(text)
        if isinstance(data, dict):
            data = [data]
        return data
    except Exception as e:
        return [{"error": str(e)}]


def list_wsl_distros():
    try:
        result = subprocess.run(
            ["wsl.exe", "-l", "-v"],
            capture_output=True, timeout=20,
            preexec_fn=_detach,
        )
        try:
            out = result.stdout.decode("utf-16le", errors="replace")
        except Exception:
            out = result.stdout.decode("utf-8", errors="replace")
        if not out.strip():
            return []
        lines = out.replace("\r", "").split("\n")
        rows = []
        for line in lines:
            line = line.strip()
            if not line or line.lower().startswith("name"):
                continue
            parts = re.split(r"\s{2,}", line)
            if not parts:
                continue
            name = parts[0].lstrip("* ").strip()
            state = parts[1] if len(parts) > 1 else ""
            version = parts[2] if len(parts) > 2 else "2"
            is_default = parts[0].startswith("*")
            rows.append({
                "name": name,
                "state": state.strip(),
                "version": version.strip(),
                "is_default": is_default,
            })
        return rows
    except FileNotFoundError:
        return []
    except Exception as e:
        return [{"error": str(e)}]


def list_wsl_filesystems():
    try:
        result = subprocess.run(
            ["wsl.exe", "-d", "Ubuntu-22.04", "--", "bash", "-lc",
             "df -B1 -x tmpfs -x devtmpfs -x squashfs 2>/dev/null | tail -n +2"],
            capture_output=True, timeout=20,
            preexec_fn=_detach,
        )
        if result.returncode != 0:
            return []
        mounts = []
        for line in result.stdout.decode("utf-8", errors="replace").split("\n"):
            parts = line.split()
            if len(parts) < 6:
                continue
            try:
                total = int(parts[1])
                used = int(parts[2])
                avail = int(parts[3])
            except ValueError:
                continue
            if total == 0:
                continue
            mounts.append({
                "filesystem": parts[0],
                "size_bytes": total,
                "used_bytes": used,
                "avail_bytes": avail,
                "used_pct": int(used * 100 / total),
                "mount": parts[5],
            })
        return mounts
    except Exception as e:
        return [{"error": str(e)}]


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write(f"[cron-server] {fmt % args}\n")

    def _send(self, code, data):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors()
        self.end_headers()
        self.wfile.write(body)

    def _send_cors(self):
        origin = self.headers.get("Origin", "")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _check_auth(self):
        if not API_KEY:
            return True
        auth = self.headers.get("Authorization", "")
        return auth == f"Bearer {API_KEY}"

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if not self._check_auth():
            self._send(401, {"error": "Unauthorized"})
            return
        if path == "/cron-api/jobs":
            self._send(200, list_jobs())
        elif path == "/cron-api/status":
            self._send(200, run_hermes("status"))
        elif path == "/cron-api/system/drives":
            self._send(200, {"drives": list_windows_drives()})
        elif path == "/cron-api/system/wsl":
            self._send(200, {"distros": list_wsl_distros()})
        elif path == "/cron-api/system/wsl-fs":
            self._send(200, {"mounts": list_wsl_filesystems()})
        elif path == "/cron-api/settings":
            self._send(200, get_settings_overview())
        elif path == "/cron-api/settings/config":
            cfg = load_hermes_config()
            self._send(200, filter_config_for_client(cfg))
        elif path == "/cron-api/settings/marvis":
            self._send(200, load_marvis_settings())
        elif path == "/cron-api/settings/providers":
            self._send(200, get_providers_status())
        elif path == "/cron-api/settings/gateway":
            self._send(200, get_gateway_status())
        elif path == "/cron-api/settings/mcp":
            self._send(200, get_mcp_servers())
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        if not self._check_auth():
            self._send(401, {"error": "Unauthorized"})
            return
        body = self._read_body()
        if path == "/cron-api/jobs":
            self._send(200, create_job(body))
        elif path.startswith("/cron-api/jobs/") and path.endswith("/pause"):
            job_id = path.split("/")[3]
            self._send(200, run_action(job_id, "pause"))
        elif path.startswith("/cron-api/jobs/") and path.endswith("/resume"):
            job_id = path.split("/")[3]
            self._send(200, run_action(job_id, "resume"))
        elif path.startswith("/cron-api/jobs/") and path.endswith("/run"):
            job_id = path.split("/")[3]
            self._send(200, run_action(job_id, "run"))
        elif path == "/cron-api/settings/providers/connect":
            self._send(200, connect_provider(
                body.get("provider", ""), body.get("api_key", ""), body.get("base_url")
            ))
        elif path == "/cron-api/settings/providers/test":
            self._send(200, test_provider(
                body.get("provider", ""), body.get("api_key", ""), body.get("base_url")
            ))
        elif path == "/cron-api/settings/mcp":
            name = body.get("name", "").strip()
            if not name:
                self._send(400, {"error": "name required"})
            else:
                config = {k: v for k, v in body.items() if k != "name"}
                self._send(200, add_mcp_server(name, config))
        else:
            self._send(404, {"error": "not found"})

    def do_PATCH(self):
        path = urlparse(self.path).path
        if not self._check_auth():
            self._send(401, {"error": "Unauthorized"})
            return
        if path.startswith("/cron-api/jobs/"):
            job_id = path.split("/")[3]
            self._send(200, edit_job(job_id, self._read_body()))
        else:
            self._send(404, {"error": "not found"})

    def do_PUT(self):
        path = urlparse(self.path).path
        if not self._check_auth():
            self._send(401, {"error": "Unauthorized"})
            return
        body = self._read_body()
        if path == "/cron-api/settings/config":
            cfg = load_hermes_config()
            updates = body.get("updates", {})
            if not updates:
                single_path = body.get("path")
                single_val = body.get("value")
                if single_path:
                    updates = {single_path: single_val}
            for dotted, val in updates.items():
                _deep_set(cfg, dotted, val)
            try:
                save_hermes_config(cfg)
                self._send(200, {"ok": True, "updated": list(updates.keys())})
            except Exception as e:
                self._send(500, {"ok": False, "error": str(e)})
        elif path == "/cron-api/settings/marvis":
            try:
                result = save_marvis_settings(body)
                self._send(200, {"ok": True, "settings": result})
            except Exception as e:
                self._send(500, {"ok": False, "error": str(e)})
        elif path.startswith("/cron-api/settings/mcp/"):
            name = path.split("/")[4]
            self._send(200, update_mcp_server(name, body))
        else:
            self._send(404, {"error": "not found"})

    def do_DELETE(self):
        path = urlparse(self.path).path
        if not self._check_auth():
            self._send(401, {"error": "Unauthorized"})
            return
        if path.startswith("/cron-api/jobs/") and "/settings/" not in path:
            job_id = path.split("/")[3]
            self._send(200, run_action(job_id, "remove"))
        elif path.startswith("/cron-api/settings/providers/"):
            provider_id = path.split("/")[4]
            self._send(200, disconnect_provider(provider_id))
        elif path.startswith("/cron-api/settings/mcp/"):
            name = path.split("/")[4]
            self._send(200, delete_mcp_server(name))
        else:
            self._send(404, {"error": "not found"})


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    sys.stderr.write(f"[cron-server] listening on :{PORT}\n")
    sys.stderr.write(f"[cron-server] auth: {'enabled' if API_KEY else 'disabled'}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
