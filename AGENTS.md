# ride-coach — Agent Instructions

**사이클링 AI 코치** — Strava 세그먼트·코스 + Open-Meteo 무풍 등가 파워.

## 스킬

| 스킬 | 경로 |
|------|------|
| ride-coach (허브) | `SKILL.md` |
| analyze-cycle | `analyze-cycle/SKILL.md` |
| weather-power | `weather-power/SKILL.md` |

## 새 사용자

1. [docs/getting-started.md](docs/getting-started.md)
2. [docs/setup-strava-mcp.md](docs/setup-strava-mcp.md) — **Strava MCP 필수**
3. [docs/segment-analysis.md](docs/segment-analysis.md)

## Strava MCP

- `~/.cursor/mcp.json` → `strava` 서버 + OAuth
- 도구명: `user-strava`
- 없으면: [docs/manual-strava-data.md](docs/manual-strava-data.md)

## 출력 용어 (한글)

| 내부 | 사용자에게 |
|------|------------|
| rawAvgW | 기록 파워(W) |
| zeroWindW | 무풍 등가 파워(W) |
| windDeltaW | 바람 보정(W) |

## 우선순위

1. 세그먼트 **시간**
2. 무풍 등가 파워
3. 기록 파워 단독 비교 금지

## 스크립트

```bash
node scripts/correct-power.mjs --lat … --lng … --date … --hour … --streams …
```
