# Glossary (ride-coach)

**한국어:** [glossary.ko.md](glossary.ko.md)

AI uses **Korean terms below** when explaining to users.

## Power

| User-facing (Korean) | Code / JSON | Description |
|----------------------|-------------|-------------|
| **기록 파워** | rawAvgW, watts | Strava displayed W |
| **바람 보정** | windDeltaW | Wind adjustment W (+ headwind) |
| **노면 보정** | surfaceDeltaW | Wet surface extra W |
| **보정 파워** | zeroWindW | Recorded + wind + surface adj |
| **업힐 보정 파워** | climbZeroWindW | Corrected W on climbs 3%+ only |
| NP | weighted_average_watts | Strava NP, no weather correction |

**Corrected W = recorded W + wind adj + surface adj**

## Weather

| Korean | Field |
|--------|-------|
| 풍속 | windKmh |
| 풍향 | windFromDeg (wind **from**) |
| 역풍 구간 | headwindPct |

## Avoid in user responses

- ❌ raw W, zero-wind, 무풍 등가
- ✅ 기록 파워, 바람 보정, 보정 파워
