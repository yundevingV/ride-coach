# Platform Setup

**한국어:** [platforms.ko.md](platforms.ko.md)

## Common: clone repo

```bash
git clone https://github.com/yundevingV/ride-coach.git
cd ride-coach
```

Onboarding: [getting-started.md](./getting-started.md)

---

## Cursor (recommended — Strava MCP + skills)

### 1. Skills

```bash
mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/weather-power" ~/.cursor/skills/weather-power
```

### 2. Strava MCP

Follow [setup-strava-mcp.md](./setup-strava-mcp.md) fully.

---

## Claude Code / Claude Desktop

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)" ~/.claude/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.claude/skills/analyze-cycle
ln -sf "$(pwd)/weather-power" ~/.claude/skills/weather-power
```

---

## ChatGPT / Gemini

Upload `README.md`, `prompts/system-prompt.md`, `docs/segment-analysis.md`.

---

## Windsurf / Codex

Root `AGENTS.md` is auto-detected.

---

## Skill roles

| Skill | Role |
|-------|------|
| `ride-coach` | Hub, cycling coach |
| `analyze-cycle` | Segments, courses, FTP |
| `weather-power` | Zero-wind equivalent power |

Link all three recommended.
