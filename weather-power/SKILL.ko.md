---
name: weather-power
description: >-
  Strava 라이딩 + Open-Meteo 날씨로 풍속·노면 보정 파워(W) 계산. 추정 파워
  속도계 기준 무풍 등가 파워, 역풍/순풍·젖은 노면 보정, 활동 간 비교.
  "풍속 보정", "바람 보정 파워", "날씨 보정 W", "weather-power",
  "무풍 등가 파워" 요청 시 사용. ride-coach 하위 스킬. read-only.
---

# Weather Power (풍속·날씨 보정 파워)

**English:** [SKILL.md](SKILL.md)

ride-coach 레포의 **무풍 등가 파워** 전용 스킬.

## 사전 준비

1. `../docs/setup-strava-mcp.ko.md` — Strava MCP **필수**
2. `../docs/getting-started.ko.md` — 클론·스킬 링크

## 용어 — 사용자 응답 한글

| 영문 (내부) | **사용자에게** |
|-------------|----------------|
| raw W, rawAvgW | **기록 파워(W)** |
| zero-wind W, zeroWindW | **무풍 등가 파워(W)** |
| windDeltaW | **바람 보정(W)** |
| surfaceDeltaW | **노면 보정(W)** |
| headwindPct | **역풍 구간(%)** |

`../docs/glossary.ko.md` 참고.

## Workflow

```
- [ ] 0. Strava MCP 확인
- [ ] 1. 활동 식별
- [ ] 2. streams (latlng, velocity_smooth, grade_smooth, watts)
- [ ] 3. Open-Meteo hourly (KST)
- [ ] 4. ../scripts/correct-power.mjs
- [ ] 5. 세그먼트 시간 교차 검증
```

### 스크립트

```bash
node ../scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams /path/to/streams.json
```

(레포 루트에서 실행 시 `scripts/correct-power.mjs`)

## Output Template

```markdown
## [활동명] 날씨·풍속 보정

### 날씨
| 기온 | 강수 | 풍속 | 풍향 | 노면 |

### 파워
| 기록 파워 | 바람 보정 | 노면 보정 | **무풍 등가 파워** | 역풍 구간 |

**한 줄 결론** + ±10~15W
```

세그먼트 분석은 `../analyze-cycle/SKILL.ko.md`와 조합.

## Examples

- "무풍 등가 파워 계산해줘"
- "PR 날 바람 보정 비교"
- "weather-power activity 19681287204"
