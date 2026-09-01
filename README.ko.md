# Ride Coach Agent Skills

**English:** [README.md](README.md)

**ride-coach**용 Agent Skills — Strava 세그먼트·코스 분석과 Open-Meteo 기반 **풍속·노면 보정 파워**를 AI 에이전트가 자동 수행합니다.

> Strava **추정 파워** 기준. 오차 **±10~15W**.

## AI 연동

**Agent Skill**로 설치하면 LLM이 전체 기능을 자동 탐색합니다:

```bash
git clone https://github.com/yundevingV/ride-coach.git
cd ride-coach

mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.cursor/skills/compare-cycle
ln -sf "$(pwd)/estimate-ftp" ~/.cursor/skills/estimate-ftp
ln -sf "$(pwd)/recap-month" ~/.cursor/skills/recap-month
```

**필수:** [Strava MCP + OAuth](docs/setup-strava-mcp.ko.md) — 없으면 활동 조회 불가.

Cursor 채팅에서 slash 또는 자연어로 호출:

```
/ride-coach 최근 라이딩 세그먼트 상위 5개 정리해줘
/analyze-cycle 어제 라이딩 분석해줘
/compare-cycle PR 세그먼트와 이번 라이딩 비교해줘
/estimate-ftp 어제 라이딩 FTP 추정해줘
/recap-month 8월 라이딩 정산
```

파워 보정 스크립트만 설치:

```bash
npm install -g .   # ride-coach-power CLI
```

## 기능

- **세그먼트** — 탐색·순위·effort 비교. PR, 경사, **시간**(1순위), 구간별 추정 파워 신뢰도.
- **코스** — 최근 라이딩·코스 세그먼트·랩 비교·코스 트렌드.
- **풍속 보정 파워** — 추정 파워에 역풍/순풍·젖은 노면 보정 → **보정 파워**.
- **PR 비교** — PR일 vs 오늘: 세그먼트 시간 + 날씨 + 보정 파워 교차 검증. 모순 시 **시간 우선**.
- **FTP·훈련** — 업힐 보정 파워 기반 FTP 추정(평지 기록 파워 금지). 주간 훈련 로드맵.
- **날씨** — Open-Meteo Archive(KST). wttr.in 폴백. 2시간+ 라이딩은 시작·중간·종료 평균.

## 빠른 시작

```bash
# 1. 클론 + 스킬 링크 (위 AI 연동 참고)

# 2. ~/.cursor/mcp.json 에 Strava MCP 설정
#    → docs/setup-strava-mcp.ko.md

# 3. 연결 확인 (Cursor Agent 채팅)
Strava MCP health 확인하고, 최근 라이딩 3개 요약해줘

# 4. 세그먼트 분석
/analyze-cycle 최근 라이딩 세그먼트 effort 상위 5개 표로 정리해줘

# 5. 풍속 보정 (샘플 데이터)
node scripts/correct-power.mjs --format json < examples/sample-input.json

# 6. 전체 파이프라인 (streams + 날씨)
node scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams ./streams.json \
  --format json
```

전체 온보딩: [docs/getting-started.ko.md](docs/getting-started.ko.md)

## 스킬

| 스킬 | Slash / 트리거 | 설명 |
| ---- | -------------- | ---- |
| `ride-coach` | `/ride-coach`, "라이딩코치" | 허브 — analyze-cycle / compare-cycle 라우팅 |
| `analyze-cycle` | `/analyze-cycle`, "세그먼트 분석" | 단일 라이딩·세그먼트 — 날씨 + 보정 파워 |
| `compare-cycle` | `/compare-cycle`, "PR 비교" | 같은 세그먼트·날짜 간 비교 |
| `estimate-ftp` | `/estimate-ftp`, `/predict-ftp`, "FTP 추정" | 최근 10회 업힐·평지 보정 구간 FTP |
| `recap-month` | `/recap-month`, "월정산" | 월별 합산·주간 볼륨·핵심 2~3라이드 |

## Strava MCP 도구

Read-only. `~/.cursor/mcp.json` 설정 (Cursor UI: `user-strava`).

| 도구 | 설명 |
| ---- | ---- |
| `health` | 연결·rate limit·캐시 |
| `get_athlete_profile` | 체중, FTP |
| `get_recent_activities` | 최근 라이딩 목록 |
| `get_activity_details` | 세그먼트 effort, 시작 시각·좌표, 기록 파워 |
| `get_activity_streams` | GPS, 속도, 경사, watts (풍속 보정 필수) |
| `get_segment_details` | 거리, 경사, PR |
| `explore_segments` | 지역 세그먼트 검색 |
| `list_my_segment_efforts` | 세그먼트 과거 기록 |
| `get_athlete_stats` | 주간·연간 통계 |
| `get_segment_effort_streams` | 단일 effort 스트림 |
| `list_routes` / `get_route_details` | 저장 코스 |
| `get_activity_laps` | 랩 스플릿 |
| `get_athlete_best_efforts` | 거리별 베스트 effort |

설정: [docs/setup-strava-mcp.ko.md](docs/setup-strava-mcp.ko.md)

## 파워 보정 CLI

`scripts/correct-power.mjs` — 사이클링 와트 모델(CdA, Crr, 체인손실).

```bash
# stdin JSON (examples/sample-input.json 참고)
node scripts/correct-power.mjs --format json < examples/sample-input.json

# Strava streams + Open-Meteo
node scripts/correct-power.mjs \
  --lat <lat> --lng <lng> \
  --date YYYY-MM-DD --hour <KST 시> \
  --rider <kg> --bike <kg> \
  --streams <streams.json 경로> \
  --format markdown    # 기본: 한글 표
  --format json        # 구조화 출력

# 날씨만 조회
node scripts/correct-power.mjs --lat 37.46 --lng 126.70 --date 2026-08-10 --hour 20
```

| 옵션 | 설명 |
| ---- | ---- |
| `--lat`, `--lng` | Open-Meteo 위치 |
| `--date` | 라이딩 날짜 (`YYYY-MM-DD`) |
| `--hour` | KST 시 (0–23) |
| `--rider` | 라이더 체중(kg), 기본 74 |
| `--bike` | 바이크+장비(kg), 기본 10 |
| `--streams` | Strava streams JSON |
| `--format` | `markdown`(기본, 한글) 또는 `json` |

npm:

```bash
npm run correct -- --format json < examples/sample-input.json
npm run example
```

## 용어 (사용자 응답 한글)

에이전트는 한글로 응답. JSON 키는 영문 유지.

| 내부 (JSON) | 사용자에게 |
| ----------- | ---------- |
| raw W, rawAvgW | **기록 파워(W)** — Strava 표시값 |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** (+역풍 / −순풍) |
| surfaceDeltaW | **노면 보정(W)** |
| headwindPct | **역풍 구간(%)** |

전체: [docs/glossary.ko.md](docs/glossary.ko.md)

## 분석 원칙

에이전트가 매 분석에 따르는 우선순위:

1. **세그먼트 시간** — 가장 신뢰
2. **보정 파워** — analyze-cycle / compare-cycle 내장
3. **기록 파워 단독** — 보정 없이 활동 간 비교 금지
4. 평지 기록 파워 → FTP 역산 금지

구간별 추정 파워 신뢰도:

| 구간 | 신뢰도 | 분석 |
| ---- | ------ | ---- |
| 업힐 3%+ | 중~상 | 보정 파워 사용 가능 |
| 롤링 | 중 | 시간 우선 |
| 평지 | 낮 | 기록 파워 참고만 |
| 다운힐 | 무시 | W 분석 제외 |

체중: Strava 프로필은 보통 **몸무게만**. 속도계 한 칸은 **몸+자전거+장비 합**인 경우 많음. 업힐 기록 파워가 낮으면 `--rider` / `--bike` 조정.

## PR 비교 (풀 패키지)

**`compare-cycle`** 사용:

```
/compare-cycle PR 세그먼트와 이번 라이딩 비교:
- 세그먼트 시간 (우선)
- 날씨 (기온·풍속·풍향)
- 보정 파워 diff
한 줄 결론 + 오차 범위
```

## MCP 없을 때

[docs/manual-strava-data.ko.md](docs/manual-strava-data.ko.md)

## 문서

| 문서 | 내용 |
| ---- | ---- |
| [getting-started.ko.md](docs/getting-started.ko.md) | 5분 온보딩 |
| [setup-strava-mcp.ko.md](docs/setup-strava-mcp.ko.md) | **MCP 설치·OAuth** |
| [segment-analysis.ko.md](docs/segment-analysis.ko.md) | 세그먼트·PR·FTP |
| [glossary.ko.md](docs/glossary.ko.md) | 한글 용어 |
| [manual-strava-data.ko.md](docs/manual-strava-data.ko.md) | MCP 없을 때 |
| [platforms.ko.md](docs/platforms.ko.md) | ChatGPT·Claude 등 |

## 레포 구조

```
ride-coach/
├── SKILL.md                 # ride-coach (허브)
├── analyze-cycle/SKILL.md   # 단일 라이딩·세그먼트
├── compare-cycle/SKILL.md   # 날짜·PR 비교
├── estimate-ftp/SKILL.md    # FTP 추정
├── recap-month/SKILL.md     # 월정산
├── scripts/correct-power.mjs
├── examples/sample-input.json
├── docs/
└── prompts/
```

## 기여 · 라이선스

[CONTRIBUTING.md](CONTRIBUTING.md) · MIT
