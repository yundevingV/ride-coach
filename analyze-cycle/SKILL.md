---
name: analyze-cycle
description: >-
  Single Strava ride or segment analysis with weather and per-segment corrected
  power. Triggers: "analyze-cycle", "세그먼트", "업힌", "코스 분석", "어제 라이딩",
  "보정 파워". Cross-day compare → compare-cycle. read-only.
---

# Analyze Cycle (Single Ride / Segment)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

**One activity** — weather + **per-segment recorded & corrected power** (mandatory when `segment_efforts` exist).

PR / multi-day compare → **`compare-cycle`**.

## Prerequisites

Strava MCP — `docs/setup-strava-mcp.md`. No MCP → `docs/manual-strava-data.md`.

## Terminology (Korean to users)

| Internal | User-facing |
|----------|-------------|
| rawAvgW | **기록 파워(W)** |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** |

Do not say raw W, zero-wind, 무풍 등가. `docs/glossary.md`.

## Workflow

```
- [ ] 0. Strava MCP (health)
- [ ] 1. Classify request
- [ ] 2. get_activity_details + get_activity_streams (latlng, velocity_smooth, grade_smooth, watts)
- [ ] 3. Save activity JSON + streams JSON to temp files
- [ ] 4. scripts/segment-correct-power.mjs  ← REQUIRED if segment_efforts exist
- [ ] 5. Paste script markdown into response (do not skip segment table)
- [ ] 6. Cross-validate segment time + one-line conclusion (±10~15W)
```

**Never** show whole-ride power only when the ride has segment efforts — users expect **every segment row: 기록 파워 + 보정 파워**.

### MCP tools

| Type | Tools |
|------|-------|
| Specific ride / course | `get_activity_details` → `get_activity_streams` |
| Segment search | `explore_segments`, `get_segment_details`, `list_my_segment_efforts` |
| FTP hint | uphill corrected W + `get_athlete_profile` |

## Segment power script (required)

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/activity.json \
  --streams /tmp/streams.json \
  --lat <start_lat> --lng <start_lng> \
  --date YYYY-MM-DD --hour <KST hour> \
  --rider 74 --bike 10 \
  --format markdown
```

- `--date` / `--hour` optional if `start_date_local` is in activity JSON
- `--format json` for structured output
- Whole-ride summary only: `../scripts/correct-power.mjs --streams …`

## Mandatory output structure

Copy script output, then add ride header + conclusion:

```markdown
## [활동명] — 코스 분석 (YYYY-MM-DD)

| 거리 | 이동 시간 | 상승 | 기록 파워(전체) |
(ride summary row)

(paste segment-correct-power.mjs markdown — 날씨 + 전체 + 세그먼트 표)

### 해석
- 2회전/랩 시간 diff (if applicable)
- 보정 > 기록 → 역풍 · 보정 < 기록 → 순풍
- 한 줄 결론 + 추정 파워 ±10~15W
```

### Segment table columns (must include)

| 세그먼트 | 시간 | 경사 | **기록 파워** | **보정 파워** |

Grouped by section when script detects laps (출발 / 1회전 / 2회전 / 귀가).

## Priority

1. Segment **time**
2. **Corrected power** per segment
3. No recorded-power-only comparison

## Examples

- "analyze-cycle yesterday ride"
- "어제 코스 분석해줘"
- "analyze-cycle activity 19681287204"

Compare rides → `compare-cycle`
