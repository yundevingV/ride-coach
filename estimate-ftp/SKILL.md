---
name: estimate-ftp
description: >-
  Estimate cycling FTP from recent Strava rides: uphill + flat threshold windows
  using corrected power. Triggers: "estimate-ftp", "predict-ftp", "FTP estimate",
  "FTP prediction", "내 FTP", "FTP 예상", "FTP 추정". read-only.
---

# Estimate FTP

**한국어:** [SKILL.ko.md](SKILL.ko.md)

**FTP 추정** — 최근 **~10회** 라이딩에서 **보정 파워** threshold 구간을 모아 추정.

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

## Workflow

```
- [ ] 0. Strava MCP (health)
- [ ] 1. get_athlete_profile (weight, ftp)
- [ ] 2. get_recent_activities — last 10 outdoor rides, moving_time ≥ 40 min
- [ ] 3. Per ride: get_activity_details + streams (arrays, latlng)
- [ ] 4. Build manifest JSON → scripts/estimate-ftp.mjs --manifest
- [ ] 5. Report uphill pool + flat pool + weighted estimate + confidence
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
- "내 FTP 얼마야" (scan last 10 rides)
- "최근 라이딩으로 FTP 추정"
