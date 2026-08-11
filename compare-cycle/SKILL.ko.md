---
name: compare-cycle
description: >-
  Strava 라이딩·동일 세그먼트 날짜 간 비교. 보정 파워·시간 diff, 체력 vs 날씨
  해석. "compare-cycle", "PR 비교", "저번주랑 비교", "같은 세그먼트", "활동
  비교" 요청 시. read-only.
---

# Compare Cycle (라이딩·세그먼트 비교)

**English:** [SKILL.md](SKILL.md)

**두 개 이상 활동** 또는 **같은 세그먼트 다른 날** 비교.

단일 라이딩 심층 분석 → **`analyze-cycle`** (`../analyze-cycle/SKILL.ko.md`)

## 사전 준비

Strava MCP 필수. `docs/getting-started.ko.md`, `docs/setup-strava-mcp.ko.md`

보정 파워: `../scripts/segment-correct-power.mjs` (세그먼트별) + `correct-power.mjs` (전체).

## 핵심 가정

- **세그먼트 시간** 먼저, 그다음 **보정 파워** — 기록 파워 단독 비교 금지
- 차이가 **체력**, **날씨**, **불명** 중 어디인지 명시
- 추정 파워 ±10~15W — 작은 W 차이는 노이즈일 수 있음

## 용어

analyze-cycle과 동일. `docs/glossary.ko.md`

❌ raw W, zero-wind, **무풍 등가** 노출 금지

## Workflow

```
- [ ] 0. Strava MCP
- [ ] 1. 비교 유형 분류 (아래 표)
- [ ] 2. 기준(baseline) + 비교 활동/effort 선정
- [ ] 3. 각 활동: details + streams → `segment-correct-power.mjs`
- [ ] 4. 세그먼트별 diff 표 (시간, 기록 파워, **보정 파워**)
- [ ] 5. 해석: 체력 / 날씨 / 페이싱 — 모순 시 세그먼트 시간 우선
- [ ] 6. 한 줄 결론 + 한계
```

### 비교 유형

| 유형 | 기준 | 비교 | MCP |
|------|------|------|-----|
| PR vs 오늘 (세그먼트) | PR effort 날짜 | 이번 라이딩 해당 세그먼트 | `list_my_segment_efforts`, `get_activity_details` |
| 동일 세그먼트 이력 | PR 또는 맑은 날 최고 | 최근 effort들 | `list_my_segment_efforts` |
| 두 라이딩 (전체) | 이전 또는 PR 날 | 최근 라이딩 | `get_recent_activities`, streams ×2 |
| 같은 코스 다른 날 | 사용자 지정 날짜 | | activity details ×2 |

### 기준(baseline) 선정

1. 사용자가 "PR" → 세그먼트 **PR** effort
2. 사용자 지정 날짜 ("저번 화요일")
3. 애매하면 비슷한 날씨에서 **최단 시간**
4. 어떤 기준을 썼는지 명시

## 활동별 보정

각 활동:

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/activity.json \
  --streams /tmp/streams.json \
  --lat <lat> --lng <lng> --rider 74 --bike 10 \
  --format json
```

세그먼트 **name**으로 매칭 후 diff 표 생성.

## Output Template (세그먼트별 컬럼 필수)

```markdown
## 비교: [세그먼트 또는 라이딩 페어]

### 날씨
| | 기준 | 이번 |

### 동일 세그먼트
| 세그먼트 | 시간(A) | 시간(B) | Δ | 기록 파워(A/B) | **보정 파워(A/B)** |

### 해석 + 한 줄 결론 + ±10~15W
```

### 동일 세그먼트 트렌드 (3회+)

```markdown
| 날짜 | 시간 | PR 대비 | 날씨 요약 | 보정 파워 |
```

트렌드 + 보정 파워로 PR 넘었는지.

## Examples

- "PR 세그먼트 vs 오늘 compare-cycle"
- "저번주 vs 어제 같은 업힌"
- "compare-cycle activity A vs B"
- "이번주 vs 지난주 같은 언덕"

**이 스킬 아님:** 한 라이딩 요약 → `analyze-cycle`
