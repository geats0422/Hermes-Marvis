# OpenWolf-lite State

This directory stores runtime state for the `openwolf-lite` plugin.

- `anatomy-lite.json`: file summary and token estimate index.
- `session-ledger.json`: per-session and lifetime read/write metrics.
- `buglog.json`: known error pattern -> root cause -> fix memory.
- `do-not-repeat.json`: pre-write warning rules.

All files are best-effort metadata. If missing or corrupted, the plugin recreates them with safe defaults.
