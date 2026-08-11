---
name: analyze-cycle
description: >-
  Strava 사이클링 코스·세그먼트·라이딩 분석. 추정 파워 속도계 기준 날씨 보정 W
  계산, 세그먼트 시간 비교, FTP·훈련 로드맵. "코스 분석", "세그먼트", "업힌",
  "FTP 추정", "최근 라이딩", "날씨 보정", "추정 파워", "analyze-cycle" 요청 시
  사용. 코드 수정·커밋 금지. read-only.
---

# Analyze Cycle (Strava Read-only)

**English:** [SKILL.md](SKILL.md)

## 사전 준비 (GitHub 사용자)

**Strava MCP 미설정 시 동작하지 않음.**

1. 레포 클론 + 스킬 링크 → `docs/getting-started.ko.md`
2. **Strava MCP OAuth** → `docs/setup-strava-mcp.ko.md` (필수)
3. 연결 확인: `health`, `get_recent_activities`
4. 세그먼트 가이드 → `docs/segment-analysis.ko.md`
5. 정밀 풍속 보정 → `weather-power` 스킬 (`../weather-power/SKILL.ko.md`)

MCP 없으면 → `docs/manual-strava-data.ko.md`

## 핵심 가정 (필수)

**기본: 추정 파워 속도계** (속도·GPS경사·체중 기반 모델 W). 실측 파워미터 아님.

- Strava `device_watts: true`여도 **추정 W일 수 있음** — 사용자 확인 전까지 추정 파워로 취급.
- **기록 파워 단독 비교 금지.** 무풍 등가 파워 + 세그먼트 **시간**을 함께 제시.
- 분석 우선순위: **① 세그먼트 시간 → ② 무풍 등가 파워 → ③ RPE** (평지 기록 파워·FTP 역산은 최하위).

## 용어 (사용자 응답 한글)

| 내부 | 사용자에게 |
|------|------------|
| raw W | **기록 파워(W)** |
| zero-wind W | **무풍 등가 파워(W)** |
| 보정 W | **무풍 등가 파워** 또는 **날씨 보정 파워** |

`docs/glossary.ko.md` 참고.

## 규칙

- 인사/서론 최소화. 표 + 한줄 결론 위주.
- **조회·분석만.** Strava 쓰기, 코드 수정, 커밋 금지.
- MCP: `user-strava` 필수 (`~/.cursor/mcp.json`의 `strava` 서버).
- 터미널: 날씨·보정용 `node`/`curl` 허용.
- 모든 W에 **(추정·보정 전/후)** 출처 표기.
- 추정치는 **범위**로 제시. 한계 1줄 필수.

## Workflow

```
- [ ] 0. Strava MCP 연결 확인 (health)
- [ ] 1. 요청 분류
- [ ] 2. Strava 데이터 수집
- [ ] 3. 라이딩 시간대 날씨 조회 (파워 분석 시)
- [ ] 4. weather-power 또는 휴리스틱 보정
- [ ] 5. 세그먼트 시간 교차 검증
- [ ] 6. Output Template 응답
```

### 요청 타입 → 도구

| 타입 | 도구 |
|------|------|
| 세그먼트/업힐 | `explore_segments` → `get_segment_details` |
| 최근 코스 | `get_recent_activities` → `get_activity_details` |
| 특정 라이딩 | `get_activity_details` → `get_activity_streams` |
| 날씨 W 보정 | `weather-power` 스킬 우선 |
| FTP·로드맵 | 무풍 등가 파워 + 세그먼트 PR + profile |

### Strava MCP tools

- `get_athlete_profile` — 체중(몸무게), ftp
- `get_activity_details` — segment_efforts, watts, start_latlng, start_date_local
- `get_activity_streams` — watts, grade_smooth, velocity, latlng
- `get_segment_details` — PR, elevation
- `explore_segments` / `list_my_segment_efforts` / `get_athlete_stats`

설정: `docs/setup-strava-mcp.ko.md`

---

## 추정 파워 해석

### 구간별 신뢰도

| 구간 | 기록 파워 신뢰도 | 분석 시 |
|------|-----------------|---------|
| 업힐 3%+ | 중~상 | 무풍 등가 파워 사용 가능 |
| 롤링 | 중 | 시간 우선 |
| 평지 | 낮 | 기록 파워 참고만 |
| 다운힐 | 무시 | W 분석 제외 |

### 체중 설정

| 설정 위치 | 보통 의미 |
|-----------|-----------|
| 속도계 한 칸 | **몸+자전거+장비 합** |
| Strava 프로필 | **몸무게만** |

- 몸만 넣으면 업힐 기록 파워 **과소**
- 보정 전 실제 속도계 설정 확인 권유

---

## 날씨 보정 W

> **정밀 풍속 보정** → `weather-power` (`../scripts/correct-power.mjs`, Open-Meteo).  
> 본 절은 MCP/스크립트 없을 때 **휴리스틱 폴백**.

| 요인 | 보정 (기록 파워에 가산) |
|------|------------------------|
| 젖은 노면 | +8~15W (업힐) |
| 역풍 체감 | +5~20W (범위) |
| 순풍 | -5~15W |

모순 시 → **세그먼트 시간** 우선.

---

## FTP 추정

- 평지 20분 기록 파워 → FTP **금지**
- 업힐 3~5분 **무풍 등가 파워** → FTP 110~120% 역산
- **±10~15W** 오차 명시

---

## Output Template

### 세그먼트/업힐

```
## [세그먼트명]
| 거리 | 업힐 | 경사 | PR 시간 | 기록 파워 | 무풍 등가 파워 |
- 신뢰도, 한 줄 결론
```

### 날씨 보정

```
## 날씨 (라이딩 시간대)
| 기온 | 강수 | 풍속 | 노면 |

## 보정
| 기록 파워 | 바람 보정 | 노면 보정 | 무풍 등가 파워 |
| PR 대비 시간 차 | 파워 차 |

한 줄 결론 + 추정 파워 한계
```

---

## Examples

- "최근 라이딩 세그먼트 분석"
- "이 업힌 PR vs 오늘"
- "7회전 날씨 보정해서 비교"
- "FTP 추정 (추정 파워)"
- "analyze-cycle activity 19681287204"
