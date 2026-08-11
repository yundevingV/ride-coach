# ride-coach — Agent Instructions

**한국어:** [AGENTS.ko.md](AGENTS.ko.md)

**Cycling AI coach** — Strava segments & courses + Open-Meteo zero-wind equivalent power.

## Skills

| Skill | Path |
|-------|------|
| ride-coach (hub) | `SKILL.md` |
| analyze-cycle | `analyze-cycle/SKILL.md` |
| weather-power | `weather-power/SKILL.md` |

## New users

1. [docs/getting-started.md](docs/getting-started.md)
2. [docs/setup-strava-mcp.md](docs/setup-strava-mcp.md) — **Strava MCP required**
3. [docs/segment-analysis.md](docs/segment-analysis.md)

## Strava MCP

- `~/.cursor/mcp.json` → `strava` server + OAuth
- Tool namespace: `user-strava`
- Without MCP: [docs/manual-strava-data.md](docs/manual-strava-data.md)

## Output terminology (Korean to users)

| Internal | User-facing |
|----------|-------------|
| rawAvgW | 기록 파워(W) |
| zeroWindW | 무풍 등가 파워(W) |
| windDeltaW | 바람 보정(W) |

## Priority

1. Segment **time**
2. Zero-wind equivalent power
3. Do not compare recorded power alone

## Script

```bash
node scripts/correct-power.mjs --lat … --lng … --date … --hour … --streams …
```
