# 용어집 (ride-coach)

**English:** [glossary.md](glossary.md)

AI가 사용자에게 결과를 설명할 때 **아래 한글 표기를 사용**합니다.

## 파워

| 한글 | 영문 (코드/JSON) | 설명 |
|------|------------------|------|
| 기록 파워 | raw W, rawAvgW, watts | Strava가 보여주는 W. 바람·노면이 섞인 값 |
| 무풍 등가 파워 | zero-wind W, zeroWindW | 바람이 0일 때 같은 속도·경사에 필요한 W |
| 바람 보정 | windDeltaW | 무풍으로 환산할 때 가감하는 W. 역풍이면 + |
| 노면 보정 | surfaceDeltaW | 젖은 노면 추가 저항 W |
| 정규화 파워 | NP, weighted_average_watts | Strava NP. 별도 날씨 보정 없음 |

## 날씨

| 한글 | 필드 | 설명 |
|------|------|------|
| 풍속 | windKmh | km/h |
| 풍향 | windFromDeg | **바람이 오는 방향** (기상 관례, 북=0°) |
| 8방 풍향 | windFromCardinal | 북·북동·동… |
| 역풍 구간 | headwindPct | 진행 방향이 역풍인 샘플 비율 |
| 진행 방향 | bearingDeg | 라이딩 진행 방향 (GPS 추정) |

## 노면

| 한글 | 코드 | |
|------|------|---|
| 건조 | dry | 당일 강수합 ≤5mm |
| 젖음 | wet | 당일 강수합 >5mm 또는 해당 시 강수 >1mm |

## 한 줄 예시

> 기록 파워 101W, 바람 보정 +18W → **무풍 등가 파워 119W** (역풍 구간 93%)

## 피해야 할 표현

- ❌ raw W, zero-wind W (사용자 응답)
- ✅ 기록 파워, 무풍 등가 파워
