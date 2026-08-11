# Glossary (ride-coach)

**한국어:** [glossary.ko.md](glossary.ko.md)

AI should use **Korean terms below** when explaining results to users.

## Power

| User-facing (Korean) | Code / JSON | Description |
|----------------------|-------------|-------------|
| 기록 파워 | raw W, rawAvgW, watts | Strava displayed W. Includes wind and surface effects |
| 무풍 등가 파워 | zero-wind W, zeroWindW | W needed at same speed/grade with zero wind |
| 바람 보정 | windDeltaW | W added when converting to zero-wind. Positive for headwind |
| 노면 보정 | surfaceDeltaW | Extra W from wet surface resistance |
| 정규화 파워 | NP, weighted_average_watts | Strava NP. No separate weather correction |

## Weather

| User-facing (Korean) | Field | Description |
|----------------------|-------|-------------|
| 풍속 | windKmh | km/h |
| 풍향 | windFromDeg | **Wind coming from** (meteorological, N=0°) |
| 8방 풍향 | windFromCardinal | N, NE, E… |
| 역풍 구간 | headwindPct | Fraction of samples with headwind |
| 진행 방향 | bearingDeg | Ride direction (GPS estimate) |

## Surface

| User-facing (Korean) | Code | |
|----------------------|------|---|
| 건조 | dry | Daily precip ≤5mm |
| 젖음 | wet | Daily precip >5mm or hourly precip >1mm |

## Example line

> Recorded 101W, wind correction +18W → **zero-wind equivalent 119W** (headwind 93%)

## Avoid in user responses

- ❌ raw W, zero-wind W
- ✅ 기록 파워, 무풍 등가 파워
