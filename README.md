# ride-coach

**사이클링 AI 코치** — Strava + Open-Meteo로 세그먼트·코스·풍속 보정 파워 분석.

| 스킬 | 역할 |
|------|------|
| **ride-coach** | 허브 (이 레포 진입점) |
| **analyze-cycle** | 세그먼트·코스·FTP·훈련 |
| **weather-power** | 무풍 등가 파워 (풍속·노면 보정) |

> Strava **추정 파워** 기준. 오차 **±10~15W**.

---

## 🚀 빠른 시작

```bash
git clone https://github.com/YOUR_USER/ride-coach.git
cd ride-coach

mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/weather-power" ~/.cursor/skills/weather-power
```

**필수:** [Strava MCP 설정](docs/setup-strava-mcp.md) → OAuth 완료.

전체 온보딩: [docs/getting-started.md](docs/getting-started.md)

### 첫 요청

```
ride-coach: 최근 라이딩 세그먼트 상위 5개 정리해줘
```

```
라이딩코치: 어제 라이딩 무풍 등가 파워 계산해줘
```

---

## 문서

| 문서 | 내용 |
|------|------|
| [getting-started.md](docs/getting-started.md) | 5분 온보딩 |
| [setup-strava-mcp.md](docs/setup-strava-mcp.md) | **MCP 설치·OAuth** |
| [segment-analysis.md](docs/segment-analysis.md) | 세그먼트·PR |
| [용어.md](docs/용어.md) | 한글 용어 |
| [manual-strava-data.md](docs/manual-strava-data.md) | MCP 없을 때 |
| [platforms.md](docs/platforms.md) | ChatGPT·Claude 등 |

---

## 용어

| 영문 (내부) | 한글 |
|-------------|------|
| raw W | **기록 파워(W)** |
| zero-wind W | **무풍 등가 파워(W)** |
| windDeltaW | **바람 보정(W)** |

---

## 요구 사항

- **Strava MCP** — [설정](docs/setup-strava-mcp.md)
- Node.js 18+
- Open-Meteo (키 불필요)

```bash
node scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams ./streams.json
```

---

## Strava MCP (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "strava": {
      "url": "https://strava-mcp.mikekeefe.workers.dev/mcp"
    }
  }
}
```

Cursor **Connect** → `user-strava` ready 확인.

---

## 레포 구조

```
ride-coach/
├── SKILL.md                 # ride-coach (허브)
├── analyze-cycle/SKILL.md   # 세그먼트·코스
├── weather-power/SKILL.md   # 무풍 등가 파워
├── scripts/correct-power.mjs
├── docs/
└── prompts/
```

---

## 분석 원칙

1. 세그먼트 **시간** 최우선
2. **무풍 등가 파워**
3. 기록 파워 단독 비교 금지
4. read-only

## 기여 · 라이선스

[CONTRIBUTING.md](CONTRIBUTING.md) · MIT
