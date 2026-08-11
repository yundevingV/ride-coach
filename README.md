# Ride Coach Agent Skills

**한국어:** [README.ko.md](README.ko.md)

Agent skills for **ride-coach** — a cycling AI coach that analyzes Strava segments, courses, and **wind-corrected power** (보정 파워) using Open-Meteo weather data. Every power correction supports structured JSON output, and the built-in skill system lets AI agents discover and use all capabilities automatically.

> Strava **estimated power** (추정 파워) basis. Typical error **±10~15W**.

## AI Integration

Install as **Agent Skills** so your LLM can discover all capabilities:

```bash
git clone https://github.com/yundevingV/ride-coach.git
cd ride-coach

mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.cursor/skills/compare-cycle
```

**Required:** [Strava MCP + OAuth](docs/setup-strava-mcp.md) — without it, agents cannot fetch your activities.

In Cursor chat, invoke skills with slash commands or natural language:

```
/ride-coach 최근 라이딩 세그먼트 상위 5개 정리해줘
/analyze-cycle 어제 라이딩 분석해줘
/compare-cycle PR 세그먼트와 이번 라이딩 비교해줘
```

Or install the power-correction script only:

```bash
npm install -g .   # exposes ride-coach-power CLI
```

## Features

- **Segments** — Explore, rank, and compare segment efforts. PR history, climb grade, elapsed time (primary metric), estimated power with confidence by terrain.
- **Courses** — Analyze recent rides, segment efforts on a course, lap comparisons, and course-specific trends.
- **Weather Power** — Wind and surface correction on Strava estimated power. Headwind/tailwind delta, wet-road Crr adjustment, **corrected power** (보정 파워).
- **PR Comparison** — Cross-validate segment time + weather + corrected power between PR day and today. Segment time always wins on contradictions.
- **FTP & Training** — FTP estimate from uphill corrected power (not flat raw W). Weekly training roadmap suggestions.
- **Weather** — Open-Meteo Archive API hourly data (KST). wttr.in fallback. Multi-hour rides averaged at start/mid/end.

## Quick Start

```bash
# 1. Clone + link skills (see AI Integration above)

# 2. Configure Strava MCP in ~/.cursor/mcp.json
#    → docs/setup-strava-mcp.md

# 3. Verify connection (in Cursor Agent chat)
Strava MCP health 확인하고, 최근 라이딩 3개 요약해줘

# 4. Segment analysis
/analyze-cycle 최근 라이딩 세그먼트 effort 상위 5개 표로 정리해줘

# 5. Wind-corrected power (preview with sample data)
node scripts/correct-power.mjs --format json < examples/sample-input.json

# 6. Full pipeline (streams + weather)
node scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams ./streams.json \
  --format json
```

Full onboarding: [docs/getting-started.md](docs/getting-started.md)

## Skills

| Skill | Slash / trigger | Description |
| ----- | --------------- | ----------- |
| `ride-coach` | `/ride-coach`, "라이딩코치" | Hub — routes to analyze-cycle or compare-cycle |
| `analyze-cycle` | `/analyze-cycle`, "세그먼트 분석" | Single ride / segment — weather + corrected power |
| `compare-cycle` | `/compare-cycle`, "PR 비교" | Same segment or rides across days |

## Strava MCP Tools

Read-only. Configure in `~/.cursor/mcp.json` (Cursor shows as `user-strava`).

| Tool | Description |
| ---- | ----------- |
| `health` | Connection, rate limit, cache status |
| `get_athlete_profile` | Weight, FTP |
| `get_recent_activities` | Recent ride list |
| `get_activity_details` | Segment efforts, start time, coords, recorded power |
| `get_activity_streams` | GPS, speed, grade, watts (required for wind correction) |
| `get_segment_details` | Distance, grade, PR |
| `explore_segments` | Search segments by area |
| `list_my_segment_efforts` | Past efforts on a segment |
| `get_athlete_stats` | Weekly / yearly stats |
| `get_segment_effort_streams` | Streams for a single segment effort |
| `list_routes` / `get_route_details` | Saved routes |
| `get_activity_laps` | Lap splits |
| `get_athlete_best_efforts` | Best efforts by distance |

Setup guide: [docs/setup-strava-mcp.md](docs/setup-strava-mcp.md)

## Power Correction CLI

`scripts/correct-power.mjs` — physics model aligned with cycling wattage calculators (CdA, Crr, chain loss).

```bash
# stdin JSON (see examples/sample-input.json)
node scripts/correct-power.mjs --format json < examples/sample-input.json

# Strava streams file + Open-Meteo weather
node scripts/correct-power.mjs \
  --lat <lat> --lng <lng> \
  --date YYYY-MM-DD --hour <KST hour> \
  --rider <kg> --bike <kg> \
  --streams <path-to-streams.json> \
  --format markdown    # default: Korean markdown table
  --format json        # structured output

# Weather only (no streams)
node scripts/correct-power.mjs --lat 37.46 --lng 126.70 --date 2026-08-10 --hour 20
```

| Flag | Description |
| ---- | ----------- |
| `--lat`, `--lng` | Location for Open-Meteo |
| `--date` | Ride date (`YYYY-MM-DD`) |
| `--hour` | KST hour (0–23) |
| `--rider` | Rider weight (kg), default 74 |
| `--bike` | Bike + gear weight (kg), default 10 |
| `--streams` | Strava streams JSON (`latlng`, `velocity_smooth`, `grade_smooth`, `watts`) |
| `--format` | `markdown` (default, Korean) or `json` |

npm scripts:

```bash
npm run correct -- --format json < examples/sample-input.json
npm run example
```

## Terminology (user-facing Korean)

Agents respond in Korean. Internal JSON keys stay English.

| Internal (JSON) | User-facing |
| ----------------- | ----------- |
| raw W, rawAvgW | **기록 파워(W)** — Strava displayed value |
| zeroWindW | **보정 파워(W)** |
| windDeltaW | **바람 보정(W)** (+ headwind / − tailwind) |
| surfaceDeltaW | **노면 보정(W)** |
| headwindPct | **역풍 구간(%)** |

Full glossary: [docs/glossary.md](docs/glossary.md)

## Analysis Principles

Priority order — agents follow this on every analysis:

1. **Segment time** — most reliable
2. **Corrected power** (보정 파워) — built into analyze-cycle / compare-cycle
3. **Recorded power alone** — do not compare across rides without correction
4. Flat raw W → FTP back-calculation — forbidden

Terrain confidence for estimated power:

| Terrain | Confidence | Use |
| ------- | ---------- | --- |
| Climb 3%+ | Medium–High | Corrected power OK |
| Rolling | Medium | Time first |
| Flat | Low | Recorded power reference only |
| Downhill | Ignore | Exclude from W analysis |

Weight note: Strava profile is usually **body only**. Speedometer device field is often **body + bike + gear**. Adjust `--rider` / `--bike` if uphill recorded power looks too low.

## PR Comparison (Full Package)

Use **`compare-cycle`**:

```
/compare-cycle PR 세그먼트와 이번 라이딩 비교:
- 세그먼트 시간 (우선)
- 날씨 (기온·풍속·풍향)
- 보정 파워 diff
한 줄 결론 + 오차 범위
```

## Manual Data (No MCP)

If Strava MCP is unavailable: [docs/manual-strava-data.md](docs/manual-strava-data.md)

## Docs

| Document | Content |
| -------- | ------- |
| [getting-started.md](docs/getting-started.md) | 5-minute onboarding |
| [setup-strava-mcp.md](docs/setup-strava-mcp.md) | **MCP install + OAuth** |
| [segment-analysis.md](docs/segment-analysis.md) | Segments, PR, FTP workflow |
| [glossary.md](docs/glossary.md) | Terminology |
| [manual-strava-data.md](docs/manual-strava-data.md) | Without MCP |
| [platforms.md](docs/platforms.md) | ChatGPT, Claude, Windsurf |

## Repo Structure

```
ride-coach/
├── SKILL.md                 # ride-coach (hub)
├── analyze-cycle/SKILL.md   # single ride / segment
├── compare-cycle/SKILL.md   # cross-day / PR comparison
├── scripts/correct-power.mjs
├── examples/sample-input.json
├── docs/
└── prompts/
```

## Contributing · License

[CONTRIBUTING.md](CONTRIBUTING.md) · MIT
