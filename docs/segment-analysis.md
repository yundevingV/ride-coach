# Segment Analysis Guide

**한국어:** [segment-analysis.ko.md](segment-analysis.ko.md)

How to analyze **segments, climbs, and PRs** with the `analyze-cycle` skill + Strava MCP.

## Prerequisites

- [Strava MCP setup](./setup-strava-mcp.md) complete
- Skills: `analyze-cycle` (+ `weather-power` for power correction)

## Core assumptions

- Strava **estimated power** (speedometer). May not be a power meter.
- **Segment time > power** — trust time when W contradicts.
- No PR/FTP conclusions from recorded power alone → zero-wind power or time.

---

## Workflow

```
1. Classify request (segment / course / FTP / weather compare)
2. Collect Strava data
3. (Power analysis) Open-Meteo weather
4. (Precise) weather-power → zero-wind equivalent power
5. Cross-validate with segment time
6. Table + one-line conclusion
```

---

## Request type → MCP tools

| Goal | MCP tool |
|------|----------|
| Find local segments | `explore_segments` |
| Segment spec & PR | `get_segment_details` |
| My segment history | `list_my_segment_efforts` |
| Segments in a ride | `get_activity_details` → `segment_efforts` |
| Detailed power & GPS | `get_activity_streams` |
| Recent rides | `get_recent_activities` |
| Weight & FTP | `get_athlete_profile` |

---

## Example prompts

### Segments on a specific ride

```
activity_id {ID} — all segment efforts in a table.
Columns: name, time, grade, recorded power, PR rank (if pr_rank exists)
```

### Climbs only

```
From my recent ride, segments with grade ≥ 3%.
Sort for time comparison.
```

### Segment PR trend

```
Segment ID {SEG_ID} — list_my_segment_efforts for time trend.
Weather: activity dates only.
```

### PR vs today (full analysis)

```
Segment {name}:
- PR day vs this ride: time, recorded power, zero-wind power
- Weather difference
- One line: fitness/conditions/weather interpretation
```

---

## Output template (segment)

```markdown
## [Segment name]

| distance | climb | grade | this time | PR | recorded W | zero-wind W |
|----------|-------|-------|-----------|-----|------------|-------------|

- Confidence: climb / flat
- One-line conclusion
- Limit: estimated power ±10~15W
```

---

## Weather & power correction

Precise wind correction → **weather-power** skill (`scripts/correct-power.mjs`).

| Korean (user) | Meaning |
|---------------|---------|
| 기록 파워 | Strava displayed W |
| 무풍 등가 파워 | Zero-wind equivalent W |
| 바람 보정 | Headwind + / tailwind − |

Heuristic only (no MCP/script) → `analyze-cycle/SKILL.md` internal table.

---

## FTP estimate (estimated power)

- Flat 20min recorded W → FTP **forbidden**
- Climb 3~5min **zero-wind power** → back-calc FTP 110~120% (range)
- State **±10~15W** error in conclusion

---

## Training goals (instead of W zones)

| Metric | Example |
|--------|---------|
| Segment time | 3:33 → 3:28 |
| RPE | Z2 4~5, intervals 7~8 |
| Corrected power (climb) | vs dry-day baseline |
| Lap pace | No crash on final lap |

---

## Common mistakes

| Mistake | Correct approach |
|---------|-------------------|
| PR on headwind day vs recorded W only | Zero-wind + **time** |
| Profile weight only in speedometer | Confirm body+bike total |
| Wind correction without latlng | Time-first, low confidence stated |
| FTP from flat W | Uphill corrected W only |

Skill source: `analyze-cycle/SKILL.md`
