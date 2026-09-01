---
name: recap-month
description: >-
  Monthly Strava ride recap: totals, weekly volume, 2–3 key rides with
  corrected power. Triggers: "recap-month", "월정산", "이번달 라이딩",
  "8월 라이딩 정산". Single ride → analyze-cycle. read-only.
---

# Recap Month (Monthly Ride Summary)

**한국어:** [SKILL.ko.md](SKILL.ko.md)

**One calendar month** — short recap. No per-ride segment dump.

Single ride → **`analyze-cycle`**. PR pair → **`compare-cycle`**.

## Prerequisites

Strava MCP — `docs/setup-strava-mcp.md`.

## Terminology (Korean to users)

| Internal | User-facing |
|----------|-------------|
| rawAvgW | **기록 파워(W)** |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** |

Do not say raw W, zero-wind, 무풍 등가.

## Workflow

```
- [ ] 0. Strava MCP (health) + get_athlete_profile (FTP, weight)
- [ ] 1. Parse month (default: last completed month, or named "8월" / "이번달")
- [ ] 2. get_recent_activities until month covered (Ride only; skip Workout)
- [ ] 3. Sum: count, km, moving time, elevation, time-weighted recorded W
- [ ] 4. Weekly buckets + ride list (one row each)
- [ ] 5. Pick 2–3 key rides: longest, most elevation, highest recorded W (GPS required)
- [ ] 6. Those only → streams + segment-correct-power.mjs (peak table + whole-ride 보정 파워)
- [ ] 7. Short interpretation + one-line conclusion (±10~15W)
- [ ] 8. Instagram card — only if user asks (see below)
```

**Never** run correction on every ride. Manual / no-GPS rides: list them, skip script.

## Key-ride script

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/a.json --streams /tmp/s.json \
  --lat … --lng … --rider 74 --bike 10 --ftp 192 --format markdown
```

Paste **날씨 + 전체 + 구간 최고 파워** only. Drop long segment tables unless user asks.

## Output (keep short)

```markdown
## [월] 라이딩 정산 (YYYY-MM)

| 횟수 | 거리 | 이동 시간 | 상승 | 기록 파워(시간가중) |
(totals)

### 주간
| 주 | 횟수 | 거리 |

### 라이드 목록
| 날짜 | 활동 | 거리 | 시간 | 상승 | 기록 파워 |

### 핵심 라이드
(2–3 rides: 보정 파워 + 구간 최고 파워)

### 해석
- 볼륨 / 피크 / 구멍
- 한 줄 결론 + ±10~15W
```

Priority: **time + volume** first, then **보정 파워** on key rides. No recorded-W-only ranking.

## Instagram card (optional)

Cursor `GenerateImage` **only if the user asks** ("인스타", "카드", "이미지 만들어줘").

- Aspect **4:5** (feed) or **9:16** (story)
- Visual: night ride / bike / city — **no charts, no stats tables** (image text is unreliable)
- Put real numbers in the **chat caption** the user can copy
- Do not generate an image unless asked

## Examples

- "recap-month 8월"
- "이번달 라이딩 정산"
- "/recap-month + 인스타 카드"
