# 세그먼트 분석 가이드

**English:** [segment-analysis.md](segment-analysis.md)

**`analyze-cycle`** (단일) + **`compare-cycle`** (날짜·PR 비교)로 세그먼트·업힌·PR 분석.

## 사전 조건

- [Strava MCP 설정](./setup-strava-mcp.ko.md) 완료
- 스킬: `analyze-cycle`, `compare-cycle`

## 스킬 라우팅

| 목적 | 스킬 |
|------|------|
| 한 라이딩, 한 세그먼트, 업힌 코스 | `analyze-cycle` |
| PR vs 오늘, 같은 세그먼트 다른 날, 두 라이딩 | `compare-cycle` |

## 핵심 가정

- Strava **추정 파워** (속도계). 실측 파워미터 아닐 수 있음.
- **세그먼트 시간 > 파워** — W가 모순되면 시간을 믿음.
- 기록 파워만으로 PR/ FTP 결론 **금지** → 보정 파워 또는 시간.

---

## 워크플로 (analyze-cycle)

```
1. 분류: 전체 라이딩 / 세그먼트 / 코스 / FTP 힌트
2. Strava 데이터 + streams
3. Open-Meteo 날씨
4. scripts/segment-correct-power.mjs → 세그먼트별 보정 파워
5. 세그먼트 시간 교차 검증
6. 표 + 한 줄 결론
```

## 워크플로 (compare-cycle)

```
1. 기준 + 비교 활동/effort 선정
2. 각 활동에 analyze-cycle 단계 실행
3. diff 표: 시간, 날씨, 보정 파워
4. 체력 vs 날씨 해석
5. 한 줄 결론
```

---

## 요청 유형 → MCP 도구

| 하고 싶은 것 | MCP 도구 |
|--------------|----------|
| 지역 세그먼트 찾기 | `explore_segments` |
| 세그먼트 스펙·PR | `get_segment_details` |
| 내 세그먼트 기록 추이 | `list_my_segment_efforts` |
| 라이딩 안 세그먼트 | `get_activity_details` → `segment_efforts` |
| 상세 파워·GPS | `get_activity_streams` |
| 최근 라이딩 목록 | `get_recent_activities` |
| 몸무게·FTP | `get_athlete_profile` |

---

## 예시 프롬프트

### 특정 라이딩 세그먼트 → analyze-cycle

```
activity_id {ID} — 세그먼트 effort 전체 표.
열: 이름, 시간, 경사, 기록 파워, 보정 파워, PR 순위
```

### 업힌만 → analyze-cycle

```
최근 라이딩에서 경사 3% 이상 세그먼트.
날씨 + 업힐 보정 파워 포함.
```

### 세그먼트 PR 트렌드 → compare-cycle

```
세그먼트 ID {SEG_ID} — list_my_segment_efforts 시간 추이.
effort별 보정 파워 + 날씨 요약.
```

### PR vs 오늘 → compare-cycle

```
/compare-cycle 세그먼트 {name}:
- PR 날 vs 이번: 시간, 기록 파워, 보정 파워
- 날씨 차이
- 한 줄: 체력 / 날씨 해석
```

---

## 출력 템플릿 (단일 세그먼트 — analyze-cycle)

```markdown
## [세그먼트명]

| 거리 | 경사 | 시간 | PR | 기록 파워 | 보정 파워 |

날씨 블록 + 한 줄 결론 + ±10~15W
```

## 출력 템플릿 (비교 — compare-cycle)

```markdown
| | 기준 | 이번 | 차이 |
| 시간 | | | |
| 보정 파워 | | | |
| 날씨 | | | |

결론 + 한계
```

---

## 날씨·파워 보정

두 스킬 모두 `scripts/segment-correct-power.mjs`(세그먼트별) + `scripts/correct-power.mjs`(전체).

| 한글 (사용자) | 의미 |
|---------------|------|
| 기록 파워 | Strava 표시 W |
| 보정 파워 | 날씨 보정 W |
| 바람 보정 | 역풍 + / 순풍 − |

휴리스틱 폴백 (streams 없음) → `analyze-cycle/SKILL.ko.md`

---

## FTP 추정 (추정 파워)

- 평지 20분 기록 파워 → FTP **금지**
- 업힐 3~5분 **보정 파워** → FTP 110~120% 역산 (범위)
- 결론에 **±10~15W** 오차 명시

---

## 훈련 목표

| 지표 | 예시 |
|------|------|
| **심박 (Intervals LTHR 7존)** | Z2 라이딩 → 평균·체류 **Z1~Z2** (`docs/glossary.ko.md`) |
| 세그먼트 시간 | 3:33 → 3:28 |
| RPE | Z2 4~5, 인터벌 7~8 |
| 보정 파워 (업힐) | 맑은 날 기준 대비 |
| 랩 페이스 | 마지막 랩 크래시 없이 |

추정 파워 라이더: **강도 판단은 심박 우선**, W 존·라이덕 파워 분포는 참고만.

---

## 자주 하는 실수

| 실수 | 올바른 접근 |
|------|-------------|
| 역풍 PR 날 vs 기록 파워만 | 보정 파워 + **시간** |
| 속도계에 프로필 체중만 | 몸+바이크 합 확인 |
| latlng 없이 풍속 보정 | MCP **arrays** 재요청 → [manual-strava-data.ko.md](./manual-strava-data.ko.md) **GPS 없을 때** |
| 평지 W로 FTP | 업힐 보정 파워만 |
| PR 비교에 analyze-cycle | **compare-cycle** 사용 |
| 심박을 맥스 %·라이덕 **파워** 존으로 설명 | **Intervals LTHR 7존** (`docs/glossary.ko.md`) |

스킬 원본: `analyze-cycle/SKILL.ko.md`, `compare-cycle/SKILL.ko.md`
