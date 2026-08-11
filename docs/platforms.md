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
ln -sf "$(pwd)/compare-cycle" ~/.cursor/skills/compare-cycle
```

### 2. Strava MCP

Follow [setup-strava-mcp.md](./setup-strava-mcp.md) fully.

---

## Claude Code / Claude Desktop

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)" ~/.claude/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.claude/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.claude/skills/compare-cycle
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
| `analyze-cycle` | Single ride / segment + corrected power |
| `compare-cycle` | Cross-day / PR comparison |

Link all three recommended.
