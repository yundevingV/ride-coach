---
name: analyze-cycle
description: >-
  단일 Strava 라이딩·코스 분석. 날씨, 세그먼트별 기록·보정 파워, 구간 최고 파워
  (15초~60분). "analyze-cycle", "1분 파워", "2분 파워", "코스 분석", "보정 파워".
  비교 → compare-cycle. read-only.
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

**심박:** 훈련 강도·Z2 판단 → **Intervals.icu LTHR 7존** (`docs/glossary.ko.md`). LTHR 미상 시 사용자에게 확인. ❌ 맥스 % 5존, Strava 5존, 라이덕 **파워** 7존으로 심박 설명.

## Workflow

```
- [ ] 0. Strava MCP (health)
- [ ] 1. 요청 분류
- [ ] 2. get_activity_details + get_activity_streams (`format: "arrays"`, `stream_types`에 **latlng** 포함) + `get_athlete_profile` (FTP). latlng 없으면 → `docs/manual-strava-data.ko.md` **GPS 없을 때**
- [ ] 3. activity / streams JSON 임시 저장
- [ ] 4. scripts/segment-correct-power.mjs ← 필수 (**구간 최고 파워 + 세그먼트**)
- [ ] 4b. (선택) **같은 라이드** `.fit`(미밴드 자유 운동·워치) → `--fit` + `--max-hr` 등. FIT 없으면 kcal 생략. Strava 칼로리 필드 미사용.
- [ ] 5. 스크립트 markdown 포함 — **구간 최고 파워 표 + 세그먼트 표** 생략 금지
- [ ] 6. (심박 요청·강도 해석) `heartrate` streams 또는 동일 세션 Workout → **LTHR 7존** 분포·평균 bpm (`docs/glossary.ko.md`)
- [ ] 7. 세그먼트 시간 교차 검증 + 한 줄 결론 (±10~15W)
```

**구간 최고 파워**(15초·1분·2분·5분·10분·20분·60분) **생략 금지** — 라이덕 스타일 피크 파워 + **보정 파워 + FTP %**.

## 구간 최고 파워 (필수)

streams `watts` + `time` rolling 최고 평균. 스크립트: `### 구간 최고 파워`.

| 구간(초) | 표시 |
|----------|------|
| 15 | 15초 |
| 60 | **1분** |
| 120 | **2분** |
| 300 | 5분 |
| 600 | 10분 |
| 1200 | 20분 |
| 3600 | 60분 |

- 라이딩 짧으면 긴 구간 자동 생략
- `--ftp` 또는 프로필 FTP → 보정 파워 **FTP %**
- 라이덕 앱과 ±10~15W 차이 가능 (sparse streams)

```markdown
### 구간 최고 파워
| 구간 | 기록 파워 | **보정 파워** | FTP % |
| 1분 | 303 W | **312 W** | 175% |
| 2분 | 291 W | **298 W** | 168% |
```

세그먼트 없는 라이딩도 **구간 최고 파워 표는 항상** 포함.

### MCP

| 타입 | 도구 |
|------|------|
| 라이딩·코스 | `get_activity_details` → `get_activity_streams` (**arrays** + latlng) |
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
  --ftp 178 \
  --format markdown
```

선택 — FIT 심박 + Strava 거리·시간으로 **추정 kcal**:

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/activity.json \
  --streams /tmp/streams.json \
  --fit /path/to/band.fit \
  --rider 73 --bike 10 --ftp 178 \
  --max-hr 197 --age 30 --sex m --resting-hr 60 \
  --format markdown
```

- `--ftp` — 보정 파워 FTP % 표시
- `--fit` 또는 `--hr-workout` + `--hr-streams` — `### 에너지 (FIT 심박 추정)` 추가. FIT·Strava 시작 15분 이내면 세그먼트 **추정 kcal** 컬럼.
- 에너지 블록 **필수 포함**: **지방 g · 탄수 g** (kcal 괄호), **먹을거 감** (**밥 + KFC 2조각** 세트·공기 환산 — 스크립트 자동, **추정 ±20~30%**).
- FIT만 단독: `../scripts/estimate-activity-energy.mjs --fit … --km … --minutes …`
- activity JSON에 `start_date_local` 있으면 `--date`/`--hour` 생략 가능
- 전체만 필요할 때: `../scripts/correct-power.mjs --streams …`

## 필수 출력 구조

스크립트 결과 붙여넣기 + 라이딩 요약 + 결론:

```markdown
## [활동명] — 코스 분석 (날짜)

| 거리 | 이동 시간 | 상승 | 기록 파워(전체) |

(segment-correct-power.mjs 출력 — 날씨 + 전체 + **구간 최고 파워** + 세그먼트 표)

### 구간 최고 파워 (필수)

| 구간 | 기록 파워 | **보정 파워** | FTP % |
| 15초 / 1분 / 2분 / 5분 / 10분 / 20분 / 60분 |

라이딩이 짧으면 해당 구간 생략 (스크립트 자동).

### 해석
- 랩/회전 시간 diff (해당 시)
- 보정 > 기록 → 바람 보정 반영(역풍·순풍 모두 실제 노력 쪽). 바람 보정 표시: + 역풍 · − 순풍
- 한 줄 결론 + 추정 파워 ±10~15W
```

### 세그먼트 표 컬럼 (필수)

| 세그먼트 | 시간 | 경사 | **기록 파워** | **보정 파워** | (선택) **추정 kcal** |

랩 감지 시: 출발 / 1회전 / 2회전 / 귀가 구간으로 구분. `--fit` / HR Workout 시 에너지 블록은 세그먼트 표 다음 — **지방·탄수 그램 + 먹을거 감** 반드시 사용자에게 전달.

## 우선순위

1. 세그먼트 **시간**
2. 세그먼트 **보정 파워**
3. 기록 파워 단독 비교 금지

**훈련 강도(오늘 Z2 맞았나):** **심박(Intervals LTHR 7존)** 우선. 추정 파워 존 분포는 보조.

## Examples

- "어제 코스 분석해줘"
- "analyze-cycle activity 19681287204"

비교 → `compare-cycle`
