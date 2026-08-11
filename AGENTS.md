# ride-coach — Agent Instructions

**한국어:** [AGENTS.ko.md](AGENTS.ko.md)

**Cycling AI coach** — Strava segments & courses + weather-corrected power.

## Skills

| Skill | Path |
|-------|------|
| ride-coach (hub) | `SKILL.md` |
| analyze-cycle | `analyze-cycle/SKILL.md` — single ride / segment |
| compare-cycle | `compare-cycle/SKILL.md` — cross-day / PR comparison |

## New users

1. [docs/getting-started.md](docs/getting-started.md)
2. [docs/setup-strava-mcp.md](docs/setup-strava-mcp.md)
3. [docs/segment-analysis.md](docs/segment-analysis.md)

## Output terminology (Korean)

| Internal | User-facing |
|----------|-------------|
| rawAvgW | 기록 파워(W) |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | 바람 보정(W) |

Do not say 무풍 등가, raw W to users.

## Priority

1. Segment **time**
2. **Corrected power** (보정 파워)
3. No recorded-power-only comparison

## Script

```bash
# Per-segment (analyze-cycle / compare-cycle) — includes peak power table
node scripts/segment-correct-power.mjs --activity … --streams … --ftp 178 …

# Whole ride only
node scripts/correct-power.mjs --lat … --lng … --date … --hour … --streams …
```
