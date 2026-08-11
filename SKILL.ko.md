---
name: ride-coach
description: >-
  Strava 사이클링 AI 코치. 세그먼트·코스·FTP 분석, 풍속·노면 보정 파워(무풍 등가),
  PR 비교, 훈련 로드맵. "라이딩코치", "ride-coach", "세그먼트 분석", "코스 분석",
  "업힌", "FTP", "최근 라이딩", "PR 비교", "훈련" 요청 시 사용. read-only.
---

# Ride Coach (사이클링 AI 코치)

**English:** [SKILL.md](SKILL.md)

Strava + Open-Meteo로 **세그먼트·코스·파워**를 분석하는 스킬 허브.

## 사전 준비 (필수)

**Strava MCP 없으면 동작하지 않음.**

1. `docs/getting-started.ko.md` — 클론·스킬 링크
2. `docs/setup-strava-mcp.ko.md` — **MCP + OAuth**
3. 연결 확인: `health`, `get_recent_activities`

MCP 없을 때: `docs/manual-strava-data.ko.md`

## 하위 스킬

| 스킬 | 경로 | 할 일 |
|------|------|--------|
| **analyze-cycle** | `analyze-cycle/SKILL.ko.md` | 세그먼트·코스·FTP·훈련 |
| **weather-power** | `weather-power/SKILL.ko.md` | 풍속·노면 → **무풍 등가 파워** |

요청에 맞는 스킬 워크플로를 따르거나 둘을 조합 (PR 비교 = 세그먼트 시간 + 무풍 등가 파워).

## 용어 (사용자 응답 한글)

| 내부 | 사용자에게 |
|------|------------|
| raw W | **기록 파워(W)** |
| zero-wind W | **무풍 등가 파워(W)** |
| windDeltaW | **바람 보정(W)** |

`docs/glossary.ko.md` 참고. 영문 용어 노출 금지.

## 분석 우선순위

1. **세그먼트 시간**
2. **무풍 등가 파워** (weather-power)
3. 기록 파워 단독 비교 **금지**
4. 추정 파워 ±10~15W 명시

## Workflow

```
- [ ] 0. Strava MCP 확인
- [ ] 1. 요청 분류 (세그먼트 / 코스 / 파워 / FTP / PR 비교)
- [ ] 2. analyze-cycle 또는 weather-power 워크플로
- [ ] 3. 표 + 한 줄 결론
```

## Examples

- "ride-coach 최근 라이딩 세그먼트 분석"
- "라이딩코치 PR vs 오늘 업힌"
- "승기천 무풍 등가 파워"
- "FTP 추정 (추정 파워)"
- "이번 주 훈련 로드맵"

## 문서

- 세그먼트: `docs/segment-analysis.ko.md`
- MCP: `docs/setup-strava-mcp.ko.md`
- 온보딩: `docs/getting-started.ko.md`
