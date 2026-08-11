# 시작하기 — 5분 온보딩

Strava + AI로 **세그먼트 분석·풍속 보정 파워**를 쓰는 최소 경로.

## 체크리스트

```
[ ] 1. git clone + 스킬 링크
[ ] 2. Strava MCP 연결     → setup-strava-mcp.md
[ ] 3. Node.js 18+
[ ] 4. 에이전트에게 테스트 요청
```

---

## 1. 클론 & 스킬

```bash
git clone https://github.com/YOUR_USER/ride-coach.git
cd ride-coach

mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/weather-power" ~/.cursor/skills/weather-power
```

**Strava MCP** → [setup-strava-mcp.md](./setup-strava-mcp.md) **필수**.

---

## 2. Node.js (풍속 보정 스크립트)

```bash
node -v   # v18 이상

# 예시 실행
node scripts/correct-power.mjs --format json < examples/sample-input.json
```

---

## 3. 첫 번째 요청 (복사해서 채팅에 붙여넣기)

### A. 연결 테스트

```
Strava MCP health 확인하고, 최근 라이딩 3개만 요약해줘
```

### B. 세그먼트 분석

```
analyze-cycle: 최근 라이딩에서 세그먼트 effort 상위 5개 표로 정리해줘.
시간·경사·기록 파워. 추정 파워라고 명시해줘.
```

### C. 풍속 보정

```
weather-power: 어제(또는 최근) 라이딩 무풍 등가 파워 계산해줘.
한글 용어로: 기록 파워, 바람 보정, 무풍 등가 파워.
```

### D. PR 비교 (풀 패키지)

```
PR 세그먼트와 이번 라이딩 비교:
- 세그먼트 시간 (우선)
- 날씨 (기온·풍속·풍향)
- 무풍 등가 파워
한 줄 결론 + 오차 범위
```

---

## 4. 체중 설정 (추정 파워 사용자 필독)

| 어디 | 보통 의미 |
|------|-----------|
| Strava 프로필 체중 | **몸무게만** |
| Garmin 등 속도계 **한 칸** | **몸+자전거+장비 합** 인 경우 많음 |

- 몸만 넣으면 업힐 **기록 파워 과소**
- `correct-power.mjs` 기본: 프로필 몸무게 + 바이크 **10kg**
- 실제와 다르면 `--rider 74 --bike 10` 조정

---

## 5. 분석 우선순위 (스킬 공통 원칙)

1. **세그먼트 시간** — 가장 신뢰
2. **무풍 등가 파워** (weather-power)
3. **기록 파워** 단독 비교 — 금지
4. 평지 raw W로 FTP 역산 — 금지

자세한 세그먼트 워크플로 → [segment-analysis.md](./segment-analysis.md)

---

## 6. 문서 맵

| 문서 | 내용 |
|------|------|
| [setup-strava-mcp.md](./setup-strava-mcp.md) | MCP 설치·OAuth·트러블슈팅 |
| [segment-analysis.md](./segment-analysis.md) | 세그먼트·PR·FTP |
| [용어.md](./용어.md) | 한글 용어 (기록 파워, 무풍 등가…) |
| [platforms.md](./platforms.md) | ChatGPT·Claude 등 |
| [manual-strava-data.md](./manual-strava-data.md) | MCP 없을 때 |

---

## 7. 기여·피드백

이슈·PR 환영. 코스·세그먼트 예시 PR도 좋습니다.

버그: MCP 연결 / 스크립트 / 스킬 문서 불명확한 절.
