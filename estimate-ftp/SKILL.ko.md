---
name: estimate-ftp
description: >-
  최근 Strava 라이딩 업힐·평지 threshold 구간 보정 파워로 FTP 추정.
  "estimate-ftp", "predict-ftp", "FTP 예상", "FTP 추정", "내 FTP" 요청 시.
  read-only.
---

# Estimate FTP (FTP 추정)

**English:** [SKILL.md](SKILL.md)

**FTP 추정** — 최근 **~10회** 라이딩에서 **보정 파워** threshold 구간 종합.

단일 라이딩 상세 → **`analyze-cycle`**. PR 비교 → **`compare-cycle`**.

## 사전 준비

Strava MCP — `docs/setup-strava-mcp.ko.md`. **GPS latlng 필수**.

```json
get_activity_streams({
  "activity_id": 12345678,
  "format": "arrays",
  "stream_types": ["latlng", "velocity_smooth", "grade_smooth", "watts", "time"]
})
```

## 용어

| 내부 | 사용자에게 |
|------|------------|
| zeroWindW | **보정 파워(W)** |
| profile FTP | **프로필 FTP** |
| estimate | **FTP 추정** |

❌ 라이딩 전체 보정 평균 · Z2 평지 구간 → FTP 후보 아님

## Workflow

```
- [ ] 0. Strava MCP (health)
- [ ] 1. get_athlete_profile (체중, ftp)
- [ ] 2. get_recent_activities — 야외 10회, 40분+
- [ ] 3. 라이딩마다 details + streams (arrays)
- [ ] 4. manifest → estimate-ftp.mjs --manifest
- [ ] 5. 업힐 풀 + 평지 풀 + 가중 추정 + 신뢰도
```

## 스크립트 (필수)

### 다중 라이딩 (기본)

```bash
node ../scripts/estimate-ftp.mjs \
  --manifest /tmp/ftp-rides.json \
  --profile-ftp 178 \
  --rider 74 \
  --bike 10 \
  --lang ko
```

manifest 예:

```json
{
  "profileFtp": 178,
  "riderKg": 74,
  "bikeKg": 10,
  "rides": [
    { "activity": "/tmp/a1.json", "streams": "/tmp/s1.json" }
  ]
}
```

## 방법 (v2)

| 풀 | 조건 | 파워 | FTP |
|----|------|------|-----|
| **업힐 top 5** | 경사 ≥3%, 3~8분, 보정 ≥85% FTP | **보정 파워** | ÷ **1.10** |
| **평지 top 5** | 경사 <1%, 20분+, 보정 ≥75% FTP | **보정 파워** | × **0.95** |

합산: 업힐 median × **0.55** + 평지 median × **0.45**.  
후보 없음 → **프로필 FTP** ±5 W, 신뢰도 **low**.

## 신뢰도

| | |
|--|--|
| **high** | 업힐 ≥3 + 평지 ≥2 구간 |
| **medium** | 한쪽 풀만 있음 |
| **low** | threshold 구간 없음 (Z2 위주) |

**20분 테스트 없으면 ±5~10 W** 항상 명시.

## 필수 출력

```markdown
## FTP 추정

| **프로필 FTP** | 178 W |
| **추정** | **175–182 W** |
| **신뢰도** | medium |

### 업힐 풀 (상위 5)
### 평지 풀 (상위 5)
### 해석
```

## Examples

- `/estimate-ftp` · `/predict-ftp`
- "내 FTP 얼마야"
- "최근 10개 라이딩으로 FTP 추정"
