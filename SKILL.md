---
name: ride-coach
description: >-
  Strava cycling AI coach. Segments, courses, FTP, wind/surface corrected
  power, PR comparison, monthly recap, training. Triggers: "ride-coach",
  "라이딩코치", "세그먼트", "보정 파워", "FTP", "PR 비교", "월정산". read-only.
---

# Ride Coach (Cycling AI Coach)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

Hub for Strava + Open-Meteo segment, course, and power analysis.

## Prerequisites

Strava MCP required — `docs/setup-strava-mcp.md`

## Sub-skills

| Skill | When to use |
|-------|-------------|
| **analyze-cycle** | Single ride, segment, or course — weather + **corrected power** included |
| **compare-cycle** | PR vs today, same segment across days, two rides |
| **estimate-ftp** | FTP from uphill + flat corrected windows — `/predict-ftp`, `/estimate-ftp` |
| **recap-month** | One month totals + weekly volume + 2–3 key rides — `/recap-month`, "월정산" |

## Routing

| User intent | Skill |
|-------------|-------|
| Yesterday ride, this segment, uphill course | `analyze-cycle` |
| PR comparison, last week vs today, same climb | `compare-cycle` |
| FTP estimate, predict FTP, "내 FTP" | `estimate-ftp` |
| This month, 월정산, August recap | `recap-month` |
| Unclear | Ask or default to `analyze-cycle` |

## Terminology (Korean to users)

| Internal | User-facing |
|----------|-------------|
| raw W | **기록 파워(W)** |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** |

Do not say 무풍 등가, raw W to users.

## Priority

1. Segment **time**
2. **Corrected power** (보정 파워)
3. Recorded power alone — forbidden
4. State ±10~15W error

## Heart rate

**Intervals.icu LTHR 7 zones** for training intensity — `docs/glossary.md`. Estimated power riders: HR for Z2/compliance; do not conflate Riduck power zones with HR.

## Examples

- "ride-coach recent segments" → analyze-cycle
- "yesterday ride analysis" → analyze-cycle
- "PR vs today climb" → compare-cycle
- "8월 라이딩 정산" → recap-month

## Docs

- `docs/segment-analysis.md`
- `docs/getting-started.md`
