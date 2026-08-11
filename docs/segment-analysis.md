# Segment Analysis Guide

**한국어:** [segment-analysis.ko.md](segment-analysis.ko.md)

Segments, climbs, and PRs with **`analyze-cycle`** (single) and **`compare-cycle`** (cross-day).

## Prerequisites

- [Strava MCP setup](./setup-strava-mcp.md) complete
- Skills: `analyze-cycle`, `compare-cycle`

## Skill routing

| Goal | Skill |
|------|-------|
| One ride, one segment, uphill course | `analyze-cycle` |
| PR vs today, same segment other days, two rides | `compare-cycle` |

## Core assumptions

- Strava **estimated power** (speedometer). May not be a power meter.
- **Segment time > power** — trust time when W contradicts.
- No PR/FTP conclusions from recorded power alone → corrected power or time.

---

## Workflow (analyze-cycle)

```
1. Classify: whole ride / segment / course / FTP hint
2. Collect Strava data + streams
3. Open-Meteo weather
4. scripts/segment-correct-power.mjs → corrected power **per segment**
5. Cross-validate segment time
6. Table + one-line conclusion
```

## Workflow (compare-cycle)

```
1. Pick baseline + comparison activities/efforts
2. Run analyze-cycle steps for EACH activity
3. Diff table: time, weather, corrected W
4. Interpret fitness vs weather
5. One-line conclusion
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

### Segments on a specific ride → analyze-cycle

```
activity_id {ID} — all segment efforts in a table.
Columns: name, time, grade, recorded power, corrected power, PR rank
```

### Climbs only → analyze-cycle

```
From my recent ride, segments with grade ≥ 3%.
Weather + corrected power for uphill segments.
```

### Segment PR trend → compare-cycle

```
Segment ID {SEG_ID} — list_my_segment_efforts time trend.
Corrected power per effort + weather summary.
```

### PR vs today → compare-cycle

```
/compare-cycle Segment {name}:
- PR day vs this ride: time, recorded power, corrected power
- Weather difference
- One line: fitness / weather interpretation
```

---

## Output template (single segment — analyze-cycle)

```markdown
## [Segment name]

| distance | grade | time | PR | recorded W | corrected W |

Weather block + one-line conclusion + ±10~15W
```

## Output template (compare — compare-cycle)

```markdown
| | Baseline | Today | Diff |
| time | | | |
| corrected W | | | |
| weather | | | |

Verdict + limits
```

---

## Weather & power correction

Built into both skills via `scripts/segment-correct-power.mjs` (per segment) and `scripts/correct-power.mjs` (whole ride).

| Korean (user) | Meaning |
|---------------|---------|
| 기록 파워 | Strava displayed W |
| 보정 파워 | Weather-corrected W |
| 바람 보정 | Headwind + / tailwind − |

Heuristic fallback (no streams) → `analyze-cycle/SKILL.md`.

---

## FTP estimate (estimated power)

- Flat 20min recorded W → FTP **forbidden**
- Climb 3~5min **corrected power** → back-calc FTP 110~120% (range)
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
| PR on headwind day vs recorded W only | Corrected power + **time** |
| Profile weight only in speedometer | Confirm body+bike total |
| Wind correction without latlng | Time-first, low confidence stated |
| FTP from flat W | Uphill corrected W only |
| PR compare with analyze-cycle | Use **compare-cycle** |

Skill sources: `analyze-cycle/SKILL.md`, `compare-cycle/SKILL.md`
