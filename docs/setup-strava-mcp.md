# Strava MCP 설정 (Cursor · Claude 등)

이 스킬 묶음은 **Strava MCP**로 활동·세그먼트·스트림을 읽습니다.  
설정 없이는 AI가 Strava 데이터를 가져올 수 없습니다.

## 무엇이 필요한가

| 항목 | 설명 |
|------|------|
| Strava 계정 | 라이딩 기록이 있는 계정 |
| Cursor (권장) | MCP + Agent Skills 지원 |
| Node.js 18+ | `correct-power.mjs` 실행용 |

MCP 없는 AI(ChatGPT 등)는 [수동 데이터](./manual-strava-data.md) 절을 참고.

---

## 1. 레포 + 스킬 설치

```bash
git clone https://github.com/YOUR_USER/ride-coach.git
cd ride-coach

# Cursor 개인 스킬 (심볼릭 링크 권장 — git pull로 업데이트)
mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/weather-power" ~/.cursor/skills/weather-power
```

Claude Code:

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)" ~/.claude/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.claude/skills/analyze-cycle
ln -sf "$(pwd)/weather-power" ~/.claude/skills/weather-power
```

---

## 2. Cursor MCP 설정

### 2-1. `mcp.json` 편집

파일 위치: **`~/.cursor/mcp.json`** (없으면 새로 생성)

```json
{
  "mcpServers": {
    "strava": {
      "url": "https://strava-mcp.mikekeefe.workers.dev/mcp"
    }
  }
}
```

> Cursor UI에서는 서버 이름이 **`user-strava`** 로 표시됩니다. 스킬 문서의 `user-strava` = 위 `strava` 설정.

### 2-2. Cursor 재시작

`mcp.json` 저장 후 Cursor를 한 번 재시작하거나 MCP 목록을 새로고침.

### 2-3. Strava 연결 (OAuth)

1. **Cursor Settings** → **MCP** (또는 **Features → MCP**)
2. `strava` / `user-strava` 서버 찾기
3. **Connect** / **Authorize** / **Needs authentication** 클릭
4. Strava 로그인·권한 허용
5. 상태가 **ready** / 초록색이면 완료

채팅에서 MCP 인증이 필요하면 에이전트가 `mcp_auth`를 요청할 수 있습니다. 그때 승인.

### 2-4. 연결 확인

에이전트에게 다음을 요청:

```
Strava MCP health 확인해줘
```

또는 터미널이 아닌 **에이전트 채팅**에서:

- `get_athlete_profile` → 이름·체중·FTP
- `get_recent_activities` → 최근 라이딩 목록

성공 예: athlete id, 최근 Ride 목록 JSON.

---

## 3. Strava MCP 주요 도구 (세그먼트·분석용)

| 도구 | 용도 |
|------|------|
| `health` | 연결·rate limit·캐시 상태 |
| `get_athlete_profile` | 몸무게, FTP |
| `get_recent_activities` | 최근 라이딩 목록 |
| `get_activity_details` | 세그먼트 effort, 시작 시각·좌표, 기록 파워 |
| `get_activity_streams` | GPS, 속도, 경사, watts (풍속 보정 필수) |
| `get_segment_details` | 세그먼트 거리·경사·PR |
| `explore_segments` | 지역 세그먼트 검색 |
| `list_my_segment_efforts` | 특정 세그먼트 과거 기록 |
| `get_athlete_stats` | 주간·연간 통계 |

**쓰기 API 없음** — 활동 수정·업로드는 이 MCP로 불가 (read-only).

---

## 4. 스킬 조합 (권장)

| 스킬 | 할 일 |
|------|--------|
| **ride-coach** | 허브·라이딩 코치 (진입점) |
| **analyze-cycle** | 세그먼트·코스·FTP·훈련 로드맵 |
| **weather-power** | 풍속·노면 → **무풍 등가 파워** |

예시 요청:

- 「최근 승기천 세그먼트 PR 비교해줘」→ analyze-cycle
- 「어제 라이딩 바람 보정 파워」→ weather-power
- 「PR 날 vs 오늘, 세그먼트 시간 + 무풍 등가 파워」→ 둘 다

---

## 5. 문제 해결

### MCP가 `needsAuth` / 연결 실패

- Settings → MCP에서 Strava **재연결**
- Cursor 재시작
- `mcp.json` URL 오타 확인

### `user-strava` 도구가 안 보임

- `~/.cursor/mcp.json`에 `strava` 항목 있는지 확인
- MCP 서버 상태가 **error**면 로그 확인

### Rate limit

- `health`로 `shortTermUsage` / `dailyUsage` 확인
- streams는 활동당 API 호출 많음 → 같은 활동은 캐시됨

### streams에 `latlng` 없음

- 풍속 보정 신뢰도 **대폭 하락**
- 세그먼트 **시간** 위주로 분석 (analyze-cycle 기본 원칙)

### 체중·파워가 이상함

- Strava 프로필 체중 = **몸무게만** (자전거 미포함)
- 속도계 설정 = 라이더+바이크 합인 경우 많음 → [getting-started.md](./getting-started.md) 체중 절

---

## 6. 다른 MCP 서버를 쓰는 경우

Strava API를 직접 연결한 커스텀 MCP를 쓰면, 스킬에 적힌 **도구 이름**이 다를 수 있습니다.

에이전트 지침에 다음 **기능**이 있으면 됩니다:

- 활동 목록 / 상세 / streams (latlng, velocity_smooth, grade_smooth, watts)
- 세그먼트 검색 / 상세 / 내 effort 목록
- 프로필 (weight, ftp)

도구 이름이 다르면 `AGENTS.md`에 매핑表를 추가하세요.

---

## 7. 보안·권한

- Strava OAuth는 **본인 계정 읽기** 권한
- `mcp.json`을 공개 레포에 커밋할 때 **토큰을 넣지 마세요** (위 예시는 공개 URL만 사용)
- 팀 공유 시 각자 자신의 Strava로 연결

다음: [시작하기 (getting-started)](./getting-started.md)
