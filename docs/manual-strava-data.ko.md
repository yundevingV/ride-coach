# MCP 없이 Strava 데이터 쓰기

**English:** [manual-strava-data.md](manual-strava-data.md)

ChatGPT·Gemini 등 **Strava MCP가 없는 환경**용.

## 필요한 데이터

### 활동 메타 (최소)

- `start_date_local` (KST)
- `start_latlng` [lat, lng]
- `average_watts` / `weighted_average_watts`
- `segment_efforts` (세그먼트 분석 시)

### streams JSON (풍속 보정 시)

`get_activity_streams`와 동일 필드:

```json
{
  "latlng": [[37.46, 126.70], ...],
  "velocity_smooth": [6.5, ...],
  "grade_smooth": [2.1, ...],
  "watts": [101, ...]
}
```

Strava API v3: `GET /activities/{id}/streams?keys=latlng,velocity_smooth,grade_smooth,watts&key_by_type=true`

MCP 사용 시 → `format: "arrays"`, `stream_types`에 `latlng` 포함 ([setup-strava-mcp.ko.md](./setup-strava-mcp.ko.md)).

---

## GPS(`latlng`) 없을 때

풍속 **보정 파워**는 초 단위 **진행 방향(GPS)** 이 필요합니다. 없으면 아래 순서로 해결합니다.

### 1. MCP 조회 재시도 (가장 흔한 원인)

`types`만 넘기면 `latlng`가 빠지는 MCP가 있습니다. **arrays + stream_types** 로 다시 받기.

### 2. 원인 확인

| 원인 | 확인 방법 | 비고 |
|------|-----------|------|
| MCP 파라미터 | `metadata.returned_types`에 latlng 없음 | §1로 해결 |
| Riduck `stripped_*.fit` | 활동 `external_id` / 설명에 riduck 링크 | **출발·도착만** 가림, streams GPS는 **있을 수 있음** |
| 실내·트레이너 | `trainer: true` | 보정 불가 → **시간**만 |
| 수동 활동 | `manual: true` | GPS 없음 |
| 속도계 GPS OFF | 원본 FIT/GPX에 좌표 없음 | §3 |

### 3. GPX / FIT 파일로 보완

**GPX만으로는 부족**합니다. GPX = 궤적·시간·(고도). **파워(W)** 는 Strava `watts` streams 또는 FIT에서 따로 필요.

| 단계 | 내용 |
|------|------|
| A | 속도계·Garmin 등에서 **원본 FIT** 또는 **GPX** export (업로드 전 파일) |
| B | Strava MCP로 **watts + time** streams 받기 |
| C | **타임스탬프**로 GPX 좌표 ↔ watts 샘플 **정렬** |
| D | 합친 JSON을 `segment-correct-power.mjs`에 `--streams`로 전달 |

streams JSON 최소 형식:

```json
{
  "data": {
    "latlng": [[37.457, 126.709], ...],
    "velocity_smooth": [6.5, ...],
    "grade_smooth": [0.1, ...],
    "watts": [101, ...],
    "time": [0, 1, 2, ...]
  }
}
```

Strava 웹 **GPX export**는 좌표가 sparse할 수 있어, 가능하면 **속도계 원본 FIT/GPX**를 쓰세요.

### 4. 세그먼트 방향 근사 (최후 수단)

streams에 latlng 없고 GPX도 없을 때:

- `segment_efforts[].segment.start_latlng` → `end_latlng` **방위각**으로 구간별 바람 보정
- **신뢰도: 낮음** — 루프 코스·짧은 세그먼트에서 오차 큼
- 분석 시 **「GPS 근사, ±15W+」** 명시

### 5. 보정 생략

위가 모두 불가하면:

- **세그먼트 시간·경사·기록 파워**만 분석
- 보정 파워 **표시하지 않음** 또는 「미산출」
- PR·체력 판단은 **시간** 우선 (analyze-cycle 기본 원칙)

---

## AI에게 넘기는 방법

1. 레포 `prompts/system-prompt.ko.md` + `docs/glossary.ko.md` 업로드
2. streams JSON 파일 또는 활동 ID·수동 표 붙여넣기
3. 로컬에서 스크립트 실행 후 결과만 붙여넣기:

```bash
node scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams ./my-streams.json
```

## 세그먼트만 (streams 불필요)

Strava 앱·웹에서 세그먼트 시간·경사를 복사하거나,  
API로 `segment_efforts` JSON을 AI에 제공.

풍속 보정 없이 **시간·경사** 분석은 streams 없이도 가능.

## Strava API 직접 (개발자)

1. https://www.strava.com/settings/api 에서 앱 생성
2. OAuth로 access token 발급
3. curl로 activities / streams 조회

이 레포는 토큰 관리 코드를 포함하지 않습니다.  
개인 스크립트 또는 별도 MCP 서버 구축 시 참고.

MCP 설정이 가능하면 → [setup-strava-mcp.ko.md](./setup-strava-mcp.ko.md) 권장.
