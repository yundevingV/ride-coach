---
name: ride-coach
description: >-
  Strava cycling AI coach. Segment, course, FTP analysis, wind/surface corrected
  power (zero-wind equivalent), PR comparison, training roadmap. Triggers:
  "ride-coach", "라이딩코치", "세그먼트 분석", "코스 분석", "업힌", "FTP",
  "최근 라이딩", "PR 비교", "훈련". read-only.
---

# Ride Coach (Cycling AI Coach)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

Skill hub for analyzing **segments, courses, and power** via Strava + Open-Meteo.

## Prerequisites (required)

**Does not work without Strava MCP.**

1. `docs/getting-started.md` — clone and skill links
2. `docs/setup-strava-mcp.md` — **MCP + OAuth**
3. Verify: `health`, `get_recent_activities`

Without MCP: `docs/manual-strava-data.md`

## Sub-skills

| Skill | Path | Role |
|-------|------|------|
| **analyze-cycle** | `analyze-cycle/SKILL.md` | Segments, courses, FTP, training |
| **weather-power** | `weather-power/SKILL.md` | Wind/surface → **zero-wind equivalent power** |

Follow the matching workflow or combine both (PR comparison = segment time + zero-wind power).

## Terminology (Korean to users)

| Internal | User-facing |
|----------|-------------|
| raw W | **기록 파워(W)** |
| zero-wind W | **무풍 등가 파워(W)** |
| windDeltaW | **바람 보정(W)** |

See `docs/glossary.md`. Do not expose English terms to users.

## Analysis priority

1. **Segment time**
2. **Zero-wind equivalent power** (weather-power)
3. Recorded power alone — **forbidden**
4. State ±10~15W estimated-power error

## Workflow

```
- [ ] 0. Verify Strava MCP
- [ ] 1. Classify request (segment / course / power / FTP / PR compare)
- [ ] 2. analyze-cycle or weather-power workflow
- [ ] 3. Table + one-line conclusion
```

## Examples

- "ride-coach analyze recent ride segments"
- "라이딩코치 PR vs today uphill"
- "승기천 zero-wind equivalent power"
- "FTP estimate (estimated power)"
- "this week training roadmap"

## Docs

- Segments: `docs/segment-analysis.md`
- MCP: `docs/setup-strava-mcp.md`
- Onboarding: `docs/getting-started.md`
