---
name: ride-coach
description: >-
  Strava 사이클링 AI 코치. 세그먼트·코스·FTP, 풍속·노면 보정 파워, PR 비교,
  훈련 로드맵. "라이딩코치", "ride-coach", "세그먼트", "보정 파워", "업힌",
  "FTP", "PR 비교", "월정산" 요청 시. read-only.
---

# Ride Coach (사이클링 AI 코치)

**English:** [SKILL.md](SKILL.md)

Strava + Open-Meteo **세그먼트·코스·파워** 분석 허브.

## 사전 준비

**Strava MCP 필수** — `docs/setup-strava-mcp.ko.md`

## 하위 스킬

| 스킬 | 사용 시점 |
|------|-----------|
| **analyze-cycle** | 단일 라이딩·세그먼트·코스 — 날씨 + **보정 파워** 포함 |
| **compare-cycle** | PR vs 오늘, 같은 세그먼트 다른 날, 두 라이딩 비교 |
| **estimate-ftp** | 업힐·평지 보정 구간으로 FTP 추정 — `/predict-ftp`, `/estimate-ftp` |
| **recap-month** | 한 달 합산·주간 볼륨·핵심 2~3라이드 — `/recap-month`, "월정산" |

## 라우팅

| 사용자 의도 | 스킬 |
|-------------|------|
| 어제 라이딩, 이 세그먼트, 업힌 코스 | `analyze-cycle` |
| PR 비교, 저번주 vs 오늘, 같은 언덕 | `compare-cycle` |
| FTP 예상, predict-ftp, 내 FTP | `estimate-ftp` |
| 이번달, 월정산, 8월 라이딩 정산 | `recap-month` |
| 애매 | 질문 또는 `analyze-cycle` 기본 |

## 용어 (사용자 응답)

| 내부 | 사용자에게 |
|------|------------|
| raw W | **기록 파워(W)** |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** |

❌ 무풍 등가, raw W 노출 금지

## 분석 우선순위

1. **세그먼트 시간**
2. **보정 파워**
3. 기록 파워 단독 비교 **금지**
4. 추정 파워 ±10~15W 명시

## Examples

- "ride-coach 최근 세그먼트" → analyze-cycle
- "어제 라이딩 분석" → analyze-cycle
- "PR vs 오늘 업힌" → compare-cycle
- "8월 라이딩 정산" → recap-month

## 문서

- `docs/segment-analysis.ko.md`
- `docs/getting-started.ko.md`
