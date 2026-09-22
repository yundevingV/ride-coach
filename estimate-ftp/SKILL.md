---
name: estimate-ftp
description: >-
  Estimate cycling FTP from recent Strava rides: uphill + flat threshold windows
  using corrected power. Triggers: "estimate-ftp", "predict-ftp", "FTP estimate",
  "FTP prediction", "내 FTP", "FTP 예상", "FTP 추정". read-only.
---

# Estimate FTP

**한국어:** [SKILL.ko.md](SKILL.ko.md)

**FTP 추정** — 최근 **12주**(최대 **20회**) 라이딩에서 **보정 파워** threshold 구간을 모아 추정.

Single-ride deep dive → **`analyze-cycle`**. Cross-day PR → **`compare-cycle`**.

## Prerequisites

Strava MCP — `docs/setup-strava-mcp.md`. **GPS latlng required** for wind correction.

```json
get_activity_streams({
  "activity_id": 12345678,
  "format": "arrays",
  "stream_types": ["latlng", "velocity_smooth", "grade_smooth", "watts", "time"]
})
```

## Terminology

| Internal | User-facing |
|----------|-------------|
| zeroWindW / corrected | **보정 파워(W)** |
| profile FTP | **프로필 FTP** |
| estimate | **FTP 추정** |

Do not use whole-ride average or Z2 blocks. Intensity gate excludes recovery rides.

## Lookback (default)

**12 weeks**, not the last 10 rides. A short recent list is often Z2-only and starves the uphill pool. Twelve weeks stays close to current fitness and usually includes hard rides.

1. `after` = now − **84 days**. Page `get_recent_activities` until that window is covered.
2. Keep outdoor rides: `trainer` false, `moving_time` ≥ **2400** s (40 min).
3. Cap **20** rides. If more qualify, keep **signal rides** first (`weighted_average_watts` ≥ 70% of profile FTP, or `total_elevation_gain` ≥ 250 m), newest first, then fill remaining slots with the most recent other rides.
4. If fewer than **6** qualify, extend `after` to **168 days** (24 weeks). Still cap 20. Do not look further back.
5. Do not drop `weighted_average_watts`, `total_elevation_gain`, `trainer`, or `moving_time` when using `fields`.
6. State the window in the summary: `12주 · N회` (or `24주` if extended).

## Workflow

```
- [ ] 0. Strava MCP (health)
- [ ] 1. get_athlete_profile (weight, ftp)
- [ ] 2. get_recent_activities — 12 weeks, outdoor, ≥40 min, cap 20 (see Lookback)
- [ ] 3. Per ride: get_activity_details + streams (arrays, latlng)
- [ ] 4. Build manifest JSON → scripts/estimate-ftp.mjs --manifest
- [ ] 5. Report window + uphill pool + flat pool + weighted estimate + confidence
```

## Script (required)

### Multi-ride (default)

```bash
node ../scripts/estimate-ftp.mjs \
  --manifest /tmp/ftp-rides.json \
  --profile-ftp 178 \
  --rider 74 \
  --bike 10 \
  --lang ko
```

Manifest example:

```json
{
  "profileFtp": 178,
  "riderKg": 74,
  "bikeKg": 10,
  "rides": [
    { "activity": "/tmp/a1.json", "streams": "/tmp/s1.json" },
    { "activity": "/tmp/a2.json", "streams": "/tmp/s2.json" }
  ]
}
```

### Single ride (quick check)

```bash
node ../scripts/estimate-ftp.mjs \
  --activity /tmp/activity.json \
  --streams /tmp/streams.json \
  --profile-ftp 178 \
  --lang ko
```

## Method (v2)

| Pool | Filter | Power | FTP formula |
|------|--------|-------|-------------|
| **Uphill top 5** | grade ≥ 3%, 3–8 min, corrected ≥ 85% FTP | **보정 파워** | ÷ **1.10** |
| **Flat top 5** | grade < 1%, 20 min+, corrected ≥ 75% FTP | **보정 파워** | × **0.95** |

Combined: uphill median × **0.55** + flat median × **0.45**.  
No qualifying windows → keep **profile FTP** ±5 W, confidence **low**.

## Confidence

| Level | When |
|-------|------|
| **high** | Both pools: ≥3 uphill + ≥2 flat windows |
| **medium** | One pool has windows |
| **low** | No threshold windows (Z2-only history) |

Always state **±5–10 W** without a dedicated 20 min test.

## Mandatory output

```markdown
## FTP 추정

| **프로필 FTP** | 178 W |
| **추정** | **175–182 W** (가중 **178 W**) |
| **신뢰도** | medium |

### 업힐 풀 (상위 5)
### 평지 풀 (상위 5)
### 해석 + 20분 올킬 권장 여부
```

## Routing

| User | Action |
|------|--------|
| `/predict-ftp` / `/estimate-ftp` | **estimate-ftp** |
| "어제 라이딩 분석" | analyze-cycle |
| "PR vs today" | compare-cycle |

## Examples

- `/estimate-ftp` or `/predict-ftp`
- "내 FTP 얼마야" (12-week window, up to 20 rides)
- "최근 라이딩으로 FTP 추정"
