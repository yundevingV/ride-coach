---
name: analyze-cycle
description: >-
  Strava cycling course, segment, ride analysis. Estimated power (speedometer)
  weather correction, segment time comparison, FTP and training roadmap.
  Triggers: "analyze-cycle", "코스 분석", "세그먼트", "업힌", "FTP 추정",
  "최근 라이딩", "날씨 보정", "추정 파워". read-only. No code edits.
---

# Analyze Cycle (Strava Read-only)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

## Prerequisites

**Does not work without Strava MCP.**

1. Clone + skill links → `docs/getting-started.md`
2. **Strava MCP OAuth** → `docs/setup-strava-mcp.md` (required)
3. Verify: `health`, `get_recent_activities`
4. Segment guide → `docs/segment-analysis.md`
5. Precise wind correction → `weather-power` skill (`../weather-power/SKILL.md`)

Without MCP → `docs/manual-strava-data.md`

## Core assumptions (required)

**Default: estimated power speedometer** (model W from speed, GPS grade, weight). Not a power meter.

- Strava `device_watts: true` may still be **estimated W** — treat as estimated until user confirms.
- **Do not compare recorded power alone.** Present zero-wind equivalent power + segment **time** together.
- Priority: **① segment time → ② zero-wind power → ③ RPE** (flat recorded W and FTP back-calc are lowest).

## Terminology (Korean to users)

| Internal | User-facing |
|----------|-------------|
| raw W | **기록 파워(W)** |
| zero-wind W | **무풍 등가 파워(W)** |
| corrected W | **무풍 등가 파워** or **날씨 보정 파워** |

See `docs/glossary.md`.

## Rules

- Minimal greeting. Tables + one-line conclusion.
- **Read/analyze only.** No Strava writes, code edits, or commits.
- MCP: `user-strava` required (`strava` in `~/.cursor/mcp.json`).
- Terminal: `node`/`curl` allowed for weather and correction.
- Label all W with **(estimated / before/after correction)**.
- Present estimates as **ranges**. One-line limitations required.

## Workflow

```
- [ ] 0. Verify Strava MCP (health)
- [ ] 1. Classify request
- [ ] 2. Collect Strava data
- [ ] 3. Weather at ride time (for power analysis)
- [ ] 4. weather-power or heuristic correction
- [ ] 5. Cross-validate with segment time
- [ ] 6. Output Template response
```

### Request type → tools

| Type | Tools |
|------|-------|
| Segment/climb | `explore_segments` → `get_segment_details` |
| Recent course | `get_recent_activities` → `get_activity_details` |
| Specific ride | `get_activity_details` → `get_activity_streams` |
| Weather W correction | `weather-power` skill first |
| FTP/roadmap | zero-wind power + segment PR + profile |

### Strava MCP tools

- `get_athlete_profile` — weight, ftp
- `get_activity_details` — segment_efforts, watts, start_latlng, start_date_local
- `get_activity_streams` — watts, grade_smooth, velocity, latlng
- `get_segment_details` — PR, elevation
- `explore_segments` / `list_my_segment_efforts` / `get_athlete_stats`

Setup: `docs/setup-strava-mcp.md`

---

## Interpreting estimated power

### Confidence by terrain

| Terrain | Recorded W confidence | Analysis |
|---------|----------------------|----------|
| Climb 3%+ | Medium–High | Zero-wind power OK |
| Rolling | Medium | Time first |
| Flat | Low | Recorded W reference only |
| Downhill | Ignore | Exclude from W analysis |

### Weight settings

| Location | Typical meaning |
|----------|-----------------|
| Speedometer field | **Body + bike + gear total** |
| Strava profile | **Body weight only** |

- Body only → uphill recorded W **too low**
- Confirm actual speedometer setting before correction

---

## Weather correction W

> **Precise wind correction** → `weather-power` (`../scripts/correct-power.mjs`, Open-Meteo).  
> This section is **heuristic fallback** without MCP/script.

| Factor | Adjustment (added to recorded W) |
|--------|----------------------------------|
| Wet surface | +8~15W (climb) |
| Headwind feel | +5~20W (range) |
| Tailwind | -5~15W |

On contradiction → **segment time** wins.

---

## FTP estimate

- Flat 20min recorded W → FTP **forbidden**
- Climb 3~5min **zero-wind power** → back-calc FTP at 110~120%
- State **±10~15W** error

---

## Output Template

### Segment/climb

```
## [Segment name]
| distance | climb | grade | PR time | recorded W | zero-wind W |
- confidence, one-line conclusion
```

### Weather correction

```
## Weather (ride time)
| temp | precip | wind | surface |

## Correction
| recorded W | wind adj | surface adj | zero-wind W |
| vs PR time diff | power diff |

One-line conclusion + estimated power limits
```

---

## Examples

- "analyze recent ride segments"
- "this climb PR vs today"
- "compare 7 laps with weather correction"
- "FTP estimate (estimated power)"
- "analyze-cycle activity 19681287204"
