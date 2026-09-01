---
name: recap-month
description: >-
  월별 Strava 라이딩 정산. 합산·주간 볼륨·핵심 2~3라이드 보정 파워.
  "recap-month", "월정산", "이번달 라이딩", "8월 라이딩 정산".
  단일 라이딩 → analyze-cycle. read-only.
---

# Recap Month (월별 라이딩 정산)

**English:** [SKILL.md](SKILL.md)

**한 달** — 짧은 요약. 라이드마다 세그먼트 표 금지.

단일 라이딩 → **`analyze-cycle`**. PR 비교 → **`compare-cycle`**.

## 사전 준비

Strava MCP — `docs/setup-strava-mcp.ko.md`.

## 용어

| 내부 | 사용자에게 |
|------|------------|
| rawAvgW | **기록 파워(W)** |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** |

❌ raw W, 무풍 등가

## Workflow

```
- [ ] 0. Strava MCP (health) + get_athlete_profile (FTP, 체중)
- [ ] 1. 월 파싱 (기본: 직전 완료 월, 또는 "8월" / "이번달")
- [ ] 2. get_recent_activities로 해당 월 채움 (Ride만, Workout 제외)
- [ ] 3. 합산: 횟수, km, 이동 시간, 상승, 시간가중 기록 파워
- [ ] 4. 주간 버킷 + 라이드 목록 (한 줄씩)
- [ ] 5. 핵심 2~3라이드: 최장, 최다 상승, 최고 기록 파워 (GPS 있는 것만)
- [ ] 6. 그 라이드만 streams + segment-correct-power.mjs (피크 + 전체 보정 파워)
- [ ] 7. 짧은 해석 + 한 줄 결론 (±10~15W)
- [ ] 8. 인스타 카드 — 사용자가 요청할 때만
```

**전 라이드 보정 금지.** 수동입력·GPS 없음 → 목록만, 스크립트 스킵.

## 핵심 라이드 스크립트

```bash
node ../scripts/segment-correct-power.mjs \
  --activity /tmp/a.json --streams /tmp/s.json \
  --lat … --lng … --rider 74 --bike 10 --ftp 192 --format markdown
```

**날씨 + 전체 + 구간 최고 파워**만 붙임. 긴 세그먼트 표는 요청 있을 때만.

## 출력 (짧게)

```markdown
## [월] 라이딩 정산 (YYYY-MM)

| 횟수 | 거리 | 이동 시간 | 상승 | 기록 파워(시간가중) |

### 주간
| 주 | 횟수 | 거리 |

### 라이드 목록
| 날짜 | 활동 | 거리 | 시간 | 상승 | 기록 파워 |

### 핵심 라이드
(2–3회: 보정 파워 + 구간 최고 파워)

### 해석
- 볼륨 / 피크 / 구멍
- 한 줄 + ±10~15W
```

우선순위: **시간·볼륨** → 핵심 라이드 **보정 파워**. 기록 파워만으로 순위 매기지 말 것.

## 인스타 카드 (선택)

Cursor `GenerateImage`는 사용자가 **"인스타", "카드", "이미지 만들어줘"** 할 때만.

- 비율 **4:5** (피드) 또는 **9:16** (스토리)
- 분위기 컷만 — **표·숫자 차트 금지** (이미지 속 글자는 틀림)
- 실제 숫자는 **채팅 캡션**에 복붙용으로
- 요청 없으면 이미지 생성 금지

## Examples

- "recap-month 8월"
- "이번달 라이딩 정산"
- "/recap-month + 인스타 카드"
