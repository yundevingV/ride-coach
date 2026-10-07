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

## Heart rate (training intensity)

**Default: Intervals.icu LTHR 7 zones** (% of LTHR). Use **LTHR (bpm)** only when the user states it in conversation — **do not** store personal defaults in the repo (ask if unknown).

| Zone | LTHR % |
|------|--------|
| Z1 Recovery | &lt; 81% |
| Z2 Aerobic | 81–89% |
| Z3 Tempo | 90–93% |
| Z4 Sub-threshold | 94–99% |
| Z5 Threshold | 100–102% |
| Z6 VO₂ | 103–106% |
| Z7 Anaerobic | &gt; 106% |

**Estimated power (speedometer):** “Did I hit today’s intensity (e.g. Z2)?” → **HR 7 zones first**. Riduck/FTP **power** 7 zones are load/app distribution only — **not** HR zone labels.

Do **not** use Strava default 5 HR zones, Garmin % max HR 5 zones, or Riduck power zones for HR unless the user explicitly asks.

Cross-day PR/compare: still **time → corrected power** first.

## Avoid in user responses

- ❌ raw W, zero-wind, 무풍 등가
- ✅ 기록 파워, 바람 보정, 보정 파워
- ❌ HR explained only via % max 5-zone or power zones without Intervals LTHR 7
