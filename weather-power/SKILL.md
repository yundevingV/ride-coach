---
name: weather-power
description: >-
  Strava rides + Open-Meteo weather for wind/surface corrected power (W).
  Estimated power speedometer basis, zero-wind equivalent power, headwind/
  tailwind and wet-road correction, cross-ride comparison. Triggers:
  "weather-power", "풍속 보정", "바람 보정 파워", "무풍 등가 파워". read-only.
---

# Weather Power (Wind & Weather Corrected Power)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

Dedicated **zero-wind equivalent power** skill in the ride-coach repo.

## Prerequisites

1. `../docs/setup-strava-mcp.md` — Strava MCP **required**
2. `../docs/getting-started.md` — clone and skill links

## Terminology — Korean to users

| Internal | User-facing |
|----------|-------------|
| raw W, rawAvgW | **기록 파워(W)** |
| zero-wind W, zeroWindW | **무풍 등가 파워(W)** |
| windDeltaW | **바람 보정(W)** |
| surfaceDeltaW | **노면 보정(W)** |
| headwindPct | **역풍 구간(%)** |

See `../docs/glossary.md`.

## Workflow

```
- [ ] 0. Verify Strava MCP
- [ ] 1. Identify activity
- [ ] 2. streams (latlng, velocity_smooth, grade_smooth, watts)
- [ ] 3. Open-Meteo hourly (KST)
- [ ] 4. ../scripts/correct-power.mjs
- [ ] 5. Cross-validate segment time
```

### Script

```bash
node ../scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams /path/to/streams.json
```

(From repo root: `scripts/correct-power.mjs`)

## Output Template

```markdown
## [Activity] weather & wind correction

### Weather
| temp | precip | wind | direction | surface |

### Power
| recorded W | wind adj | surface adj | **zero-wind W** | headwind % |

**One-line conclusion** + ±10~15W
```

Combine with `../analyze-cycle/SKILL.md` for segment analysis.

## Examples

- "calculate zero-wind equivalent power"
- "compare PR day with wind correction"
- "weather-power activity 19681287204"
