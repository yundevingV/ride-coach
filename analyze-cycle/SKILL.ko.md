---
name: analyze-cycle
description: >-
  단일 Strava 라이딩·코스 분석. 날씨 + 세그먼트별 기록·보정 파워 필수 출력.
  "analyze-cycle", "세그먼트", "업힌", "코스 분석", "어제 라이딩", "보정 파워".
  날짜 비교 → compare-cycle. read-only.
---

# Analyze Cycle (단일 라이딩 / 코스)

**English:** [SKILL.md](SKILL.md)

**한 활동** — `segment_efforts` 있으면 **세그먼트별 기록 파워 + 보정 파워 표 필수**.

PR·여러 날 비교 → **`compare-cycle`**

## 사전 준비

Strava MCP — `docs/setup-strava-mcp.ko.md`. MCP 없음 → `docs/manual-strava-data.ko.md`

## 용어

| 내부 | 사용자에게 |
|------|------------|
| rawAvgW | **기록 파워(W)** |
| zeroWindW | **보정 파워(W)** |

❌ raw W, 무풍 등가 · `docs/glossary.ko.md`

## Workflow

```
- [ ] 0. Strava MCP (health)
- [ ] 1. 요청 분류
- [ ] 2. get_activity_details + get_activity_streams
- [ ] 3. activity / streams JSON 임시 저장
- [ ] 4. scripts/segment-correct-power.mjs 실행 ← segment_efforts 있으면 필수
- [ ] 5. 스크립트 markdown을 응답에 포함 (세그먼트 표 생략 금지)
- [ ] 6. 세그먼트 시간 교차 검증 + 한 줄 결론 (±10~15W)
```

**전체 라이딩 파워만** 보여주지 않음 — 세그먼트가 있으면 **각 행에 기록 파워·보정 파워**.

### MCP

| 타입 | 도구 |
|------|------|
| 라이딩·코스 | `get_activity_details` → `get_activity_streams` |
| 세그먼트 검색 | `explore_segments`, `get_segment_details` |
| FTP 힌트 | 업힐 보정 파워 + `get_athlete_profile` |

## 세그먼트 파워 스크립트 (필수)

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/activity.json \
  --streams /tmp/streams.json \
  --lat <start_lat> --lng <start_lng> \
  --date YYYY-MM-DD --hour <KST 시> \
  --rider 74 --bike 10 \
  --format markdown
```

- activity JSON에 `start_date_local` 있으면 `--date`/`--hour` 생략 가능
- 전체만 필요할 때: `../scripts/correct-power.mjs --streams …`

## 필수 출력 구조

스크립트 결과 붙여넣기 + 라이딩 요약 + 결론:

```markdown
## [활동명] — 코스 분석 (날짜)

| 거리 | 이동 시간 | 상승 | 기록 파워(전체) |

(segment-correct-power.mjs 출력 — 날씨 + 전체 + 세그먼트 표)

### 해석
- 랩/회전 시간 diff (해당 시)
- 보정 > 기록 → 역풍 · 보정 < 기록 → 순풍
- 한 줄 결론 + 추정 파워 ±10~15W
```

### 세그먼트 표 컬럼 (필수)

| 세그먼트 | 시간 | 경사 | **기록 파워** | **보정 파워** |

랩 감지 시: 출발 / 1회전 / 2회전 / 귀가 구간으로 구분.

## 우선순위

1. 세그먼트 **시간**
2. 세그먼트 **보정 파워**
3. 기록 파워 단독 비교 금지

## Examples

- "어제 코스 분석해줘"
- "analyze-cycle activity 19681287204"

비교 → `compare-cycle`
