# MCP 없이 Strava 데이터 쓰기

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

## AI에게 넘기는 방법

1. 레포 `prompts/system-prompt-ko.md` + `docs/용어.md` 업로드
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

MCP 설정이 가능하면 → [setup-strava-mcp.md](./setup-strava-mcp.md) 권장.
