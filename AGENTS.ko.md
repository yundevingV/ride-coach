# ride-coach — 에이전트 지침

**English:** [AGENTS.md](AGENTS.md)

**사이클링 AI 코치** — Strava 세그먼트·코스 + 날씨 보정 파워.

## 스킬

| 스킬 | 경로 |
|------|------|
| ride-coach (허브) | `SKILL.ko.md` |
| analyze-cycle | `analyze-cycle/SKILL.ko.md` — 단일 라이딩·세그먼트 |
| compare-cycle | `compare-cycle/SKILL.ko.md` — 날짜·PR 비교 |
| estimate-ftp | `estimate-ftp/SKILL.ko.md` — 업힐·평지 보정 구간 FTP 추정 |
| recap-month | `recap-month/SKILL.ko.md` — 월별 합산·핵심 라이드 |

## 신규 사용자

1. [docs/getting-started.ko.md](docs/getting-started.ko.md)
2. [docs/setup-strava-mcp.ko.md](docs/setup-strava-mcp.ko.md)
3. [docs/segment-analysis.ko.md](docs/segment-analysis.ko.md)

## 출력 용어 (한국어)

| 내부 | 사용자에게 |
|------|------------|
| rawAvgW | 기록 파워(W) |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | 바람 보정(W) |

무풍 등가, raw W 사용 금지.

## 우선순위

1. 세그먼트 **시간**
2. **보정 파워**
3. 기록 파워 단독 비교 금지

## 스크립트

```bash
# 세그먼트별 (analyze-cycle / compare-cycle) — 구간 최고 파워 포함
node scripts/segment-correct-power.mjs --activity … --streams … --ftp 178 …

# 전체 라이딩만
node scripts/correct-power.mjs --lat … --lng … --date … --hour … --streams …

# FTP 추정 (estimate-ftp / predict-ftp) — manifest 권장
node scripts/estimate-ftp.mjs --manifest … --profile-ftp 178 --rider 74 --bike 10
```
