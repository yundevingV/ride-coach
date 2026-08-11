---
name: compare-cycle
description: >-
  Compare Strava rides or the same segment across days. Weather-corrected power
  diff, segment time diff, fitness vs conditions. Triggers: "compare-cycle",
  "PR 비교", "저번주랑 비교", "같은 세그먼트", "활동 비교". read-only.
---

# Compare Cycle (Cross-Ride / Cross-Day)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

**Two or more activities** or **same segment on different days**.

Single ride deep-dive → **`analyze-cycle`** (`../analyze-cycle/SKILL.md`).

## Prerequisites

Strava MCP required. `docs/getting-started.md`, `docs/setup-strava-mcp.md`.

Power correction uses `../scripts/segment-correct-power.mjs` (per segment) + `correct-power.mjs` (whole ride).

## Core assumptions

- Compare **segment time** first, then **corrected power** — never recorded power alone
- State whether delta is likely **fitness**, **weather**, or **uncertain**
- Estimated power ±10~15W — small W diffs may be noise

## Terminology (Korean to users)

Same as analyze-cycle. See `docs/glossary.md`.

Do not say raw W, zero-wind, 무풍 등가.

## Workflow

```
- [ ] 0. Strava MCP
- [ ] 1. Identify comparison type (see table below)
- [ ] 2. Pick baseline + comparison activities/efforts
- [ ] 3. For EACH activity: details + streams → `segment-correct-power.mjs`
- [ ] 4. Build per-segment diff table (time, recorded W, **corrected W**)
- [ ] 5. Interpret: fitness / weather / pacing — segment time wins on conflict
- [ ] 6. One-line conclusion + limits
```

### Comparison types

| Type | Baseline | Compare | MCP |
|------|----------|---------|-----|
| PR vs today (segment) | PR effort date | This ride segment | `list_my_segment_efforts`, `get_activity_details` |
| Same segment history | PR or best dry day | Recent efforts | `list_my_segment_efforts` |
| Two rides (whole) | Older or PR day | Recent ride | `get_recent_activities`, streams ×2 |
| Same course different days | Pick explicit dates | | activity details ×2 |

### Baseline selection

1. Segment **PR** effort if user says "PR"
2. User-named date ("last Tuesday")
3. Best **segment time** on comparable weather if ambiguous
4. State which baseline you chose

## Per-activity correction

For each activity:

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/activity-A.json \
  --streams /tmp/streams-A.json \
  --lat <lat> --lng <lng> --rider 74 --bike 10 \
  --format json
```

Merge JSON `segments` by segment **name** for diff table.

## Output template (mandatory per-segment columns)

```markdown
## Compare: [segment or ride pair]

### Weather
| | Baseline | Today |
| temp / wind | | |

### Same segments (matched by name)
| Segment | Time (A) | Time (B) | Δ | Recorded W (A/B) | **Corrected W (A/B)** |

### Interpretation
- Time / corrected power verdict
- **Verdict:** fitness / weather / mixed
One-line + ±10~15W
```

### Same segment trend (3+ efforts)

```markdown
| date | time | vs PR | weather summary | corrected W |
```

Trend line + whether recent efforts beat PR on corrected power.

## Examples

- "compare-cycle PR segment vs today"
- "same climb last week vs yesterday"
- "compare-cycle activity A vs B"
- "이번주 vs 지난주 같은 언덕"

**Not this skill:** single ride summary → `analyze-cycle`
