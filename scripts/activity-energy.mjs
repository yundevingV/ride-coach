/**
 * HR + time (+ optional km) energy estimate; optional Garmin/Mi .fit HR.
 */

import { readFile } from 'node:fs/promises';

export function kcalPerMinFromHr({ hr, weightKg, age, sex }) {
  const w = Number(weightKg);
  const ageN = Number(age);
  const h = Number(hr);
  let kJmin;
  if (sex === 'f' || sex === 'female') {
    kJmin = -20.4022 + 0.4472 * h - 0.1263 * w + 0.074 * ageN;
  } else {
    kJmin = -55.0969 + 0.6309 * h + 0.1988 * w + 0.2017 * ageN;
  }
  return Math.max(0, kJmin / 4.184);
}

export function kcalFromDistance({ km, weightKg, minutes, sport = 'cycle' }) {
  const kg = Number(weightKg);
  const min = Number(minutes);
  if (!km || !min) return null;
  const speedKmh = (Number(km) / min) * 60;
  let met = 6;
  if (sport === 'run' || sport === 'football') met = speedKmh > 8 ? 10 : 8;
  else if (sport === 'cycle') {
    if (speedKmh < 16) met = 4;
    else if (speedKmh < 19) met = 6;
    else if (speedKmh < 22) met = 8;
    else if (speedKmh < 26) met = 10;
    else met = 12;
  } else met = 7;
  return met * kg * 0.0175 * min;
}

export function fatFraction(hr, maxHr, restingHr = 60) {
  const max = Number(maxHr) || 190;
  const rest = Number(restingHr) || 60;
  const pctMax = Math.min(1, Math.max(0, (Number(hr) - rest) / (max - rest)));
  if (pctMax < 0.6) return 0.55;
  if (pctMax < 0.75) return 0.45 - (pctMax - 0.6) * 1.0;
  if (pctMax < 0.85) return 0.3 - (pctMax - 0.75) * 1.5;
  if (pctMax < 0.92) return 0.15;
  return 0.08;
}

export function estimateEnergy({
  minutes,
  km = null,
  avgHr = null,
  maxHr = 197,
  restingHr = 60,
  weightKg = 73,
  age = 30,
  sex = 'm',
  sport = 'cycle',
}) {
  const hrKcal =
    avgHr != null ? kcalPerMinFromHr({ hr: avgHr, weightKg, age, sex }) * minutes : null;
  const distKcal = km ? kcalFromDistance({ km, weightKg, minutes, sport }) : null;
  let totalKcal = null;
  if (hrKcal != null && distKcal != null) totalKcal = 0.6 * hrKcal + 0.4 * distKcal;
  else totalKcal = hrKcal ?? distKcal;
  if (totalKcal == null) return null;

  const fatFrac = avgHr != null ? fatFraction(avgHr, maxHr, restingHr) : 0.35;
  const fatKcal = totalKcal * fatFrac;
  const carbKcal = totalKcal - fatKcal;
  return {
    minutes,
    distanceKm: km,
    avgHr,
    maxHr,
    totalKcal,
    fatFrac,
    fatKcal,
    carbKcal,
    fatG: fatKcal / 9,
    carbG: carbKcal / 4,
    hrEstimate: hrKcal,
    distanceEstimate: distKcal,
  };
}

export async function loadFit(path) {
  const { Decoder, Stream } = await import('@garmin/fitsdk');
  const buf = await readFile(path);
  const stream = Stream.fromByteArray(new Uint8Array(buf));
  const decoder = new Decoder(stream);
  const { messages } = decoder.read();
  const session = messages.sessionMesgs?.[0] ?? {};
  const records = (messages.recordMesgs ?? [])
    .filter((r) => r.heartRate != null && r.timestamp)
    .map((r) => ({
      ts: new Date(r.timestamp).getTime(),
      hr: r.heartRate,
    }))
    .sort((a, b) => a.ts - b.ts);
  const hrs = records.map((r) => r.hr);
  const avgHr =
    hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : session.avgHeartRate;
  const maxHr = hrs.length ? Math.max(...hrs) : session.maxHeartRate;
  const startMs = session.startTime
    ? new Date(session.startTime).getTime()
    : records[0]?.ts ?? null;
  const durationSec =
    session.totalTimerTime ?? session.totalMovingTime ?? session.totalElapsedTime ?? 0;
  return {
    records,
    session,
    startMs,
    minutes: durationSec / 60,
    distanceKm: session.totalDistance ? session.totalDistance / 1000 : null,
    avgHr,
    maxHr,
    deviceKcal: session.totalCalories ?? null,
  };
}

/** Strava Workout + heartrate streams (e.g. Mi Band synced without local .fit). */
export function buildFitFromStravaHr(workoutActivity, streamsPayload) {
  const data = streamsPayload.data ?? streamsPayload;
  const time = data.time ?? [];
  const hr = data.heartrate ?? [];
  const startMs = activityStartMs(workoutActivity);
  if (!startMs || !time.length || !hr.length) return null;
  const records = [];
  for (let i = 0; i < time.length; i++) {
    if (hr[i] == null) continue;
    records.push({ ts: startMs + time[i] * 1000, hr: hr[i] });
  }
  if (!records.length) return null;
  const hrs = records.map((r) => r.hr);
  return {
    records,
    session: {},
    startMs,
    minutes: (workoutActivity.moving_time ?? workoutActivity.elapsed_time ?? 0) / 60,
    distanceKm: null,
    avgHr: workoutActivity.average_heartrate ?? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length),
    maxHr: workoutActivity.max_heartrate ?? Math.max(...hrs),
    deviceKcal: workoutActivity.calories ?? null,
  };
}

export function activityStartMs(activity) {
  const s = activity.start_date ?? activity.start_date_local;
  return s ? new Date(s).getTime() : null;
}

export function avgHrInWindow(records, startMs, endMs) {
  if (!records?.length || startMs == null || endMs == null) return null;
  const inWin = records.filter((r) => r.ts >= startMs && r.ts <= endMs);
  if (!inWin.length) return null;
  return Math.round(inWin.reduce((a, r) => a + r.hr, 0) / inWin.length);
}

export function fitStravaStartDeltaMin(fit, activity) {
  const a = activityStartMs(activity);
  if (a == null || fit.startMs == null) return null;
  return Math.round((a - fit.startMs) / 60000);
}

export function buildRideEnergy({ fit, activity, streams, riderKg, age, sex, maxHr, restingHr }) {
  const km = activity.distance ? activity.distance / 1000 : null;
  const minutes = activity.moving_time ? activity.moving_time / 60 : fit?.minutes;
  const actStart = activityStartMs(activity);
  const deltaMin = fit ? fitStravaStartDeltaMin(fit, activity) : null;
  const aligned = deltaMin == null || Math.abs(deltaMin) <= 15;
  if (!aligned) {
    return { fitStartDeltaMin: deltaMin, fitAligned: false, skipped: true };
  }
  let avgHr = fit?.avgHr ?? null;
  if (fit?.records?.length && actStart != null && streams?.time?.length) {
    const t0 = streams.time[0] ?? 0;
    const t1 = streams.time[streams.time.length - 1] ?? t0;
    const hrWin = avgHrInWindow(fit.records, actStart + t0 * 1000, actStart + t1 * 1000);
    if (hrWin != null) avgHr = hrWin;
  }
  const mhr = maxHr ?? fit?.maxHr ?? 197;
  const est = estimateEnergy({
    minutes,
    km,
    avgHr,
    maxHr: mhr,
    restingHr,
    weightKg: riderKg,
    age,
    sex,
    sport: 'cycle',
  });
  if (!est) return null;
  return {
    ...est,
    deviceKcal: fit?.deviceKcal ?? null,
    fitStartDeltaMin: deltaMin,
    fitAligned: aligned,
  };
}

export function segmentEnergyKcal(fit, activity, streams, effort, riderKg, age, sex, maxHr, restingHr) {
  if (!fit?.records?.length || !streams?.time?.length) return null;
  const deltaMin = fitStravaStartDeltaMin(fit, activity);
  if (deltaMin != null && Math.abs(deltaMin) > 15) return null;
  const actStart = activityStartMs(activity);
  if (actStart == null) return null;
  const i0 = effort.start_index ?? 0;
  const i1 = effort.end_index ?? i0;
  const t0 = streams.time[i0] ?? 0;
  const t1 = streams.time[i1] ?? t0;
  const minutes = Math.max((t1 - t0) / 60, effort.elapsed_time / 60);
  const avgHr = avgHrInWindow(fit.records, actStart + t0 * 1000, actStart + t1 * 1000);
  if (avgHr == null) return null;
  const est = estimateEnergy({
    minutes,
    avgHr,
    maxHr: maxHr ?? fit.maxHr,
    restingHr,
    weightKg: riderKg,
    age,
    sex,
    sport: 'cycle',
  });
  return est ? Math.round(est.totalKcal) : null;
}

/** 밥 1공기 + KFC 오리지널 2조각 — rough “먹을거 감” (not meal advice). */
const RICE_BOWL = { kcal: 330, carbG: 55, fatG: 1 };
const KFC_TWO = { kcal: 560, fatG: 30, carbG: 24 };
const MEAL_KFC = {
  kcal: RICE_BOWL.kcal + KFC_TWO.kcal,
  fatG: RICE_BOWL.fatG + KFC_TWO.fatG,
  carbG: RICE_BOWL.carbG + KFC_TWO.carbG,
};

/** Rough food anchors for “how much is that?” (not meal advice). */
export function foodEquivalents(energy, lang) {
  if (!energy || energy.skipped) return null;
  const L = lang === 'en';
  const { fatG, carbG, totalKcal: kcal } = energy;
  const fmt = (n) => (n >= 10 ? Math.round(n) : n.toFixed(1));
  const meal = MEAL_KFC;
  const mealLabel = L ? '1 rice bowl + 2 KFC Original pcs' : '밥 1공기 + KFC 2조각';
  if (L) {
    return {
      fat: `${fmt(fatG)} g fat ≈ **${fmt(fatG / KFC_TWO.fatG)}×** (2 KFC pcs fat, ~${KFC_TWO.fatG} g)`,
      carb: `${fmt(carbG)} g carb ≈ **${fmt(carbG / RICE_BOWL.carbG)} rice bowls** (~${RICE_BOWL.carbG} g/bowl)`,
      kcal: `**${Math.round(kcal)} kcal** ≈ **${fmt(kcal / meal.kcal)}× ${mealLabel}** (~${meal.kcal} kcal/set)`,
    };
  }
  return {
    fat: `지방 **${fmt(fatG)} g** ≈ KFC **2조각** **${fmt(fatG / KFC_TWO.fatG)}회** 분량(지방 ~${KFC_TWO.fatG}g)`,
    carb: `탄수 **${fmt(carbG)} g** ≈ 밥 **${fmt(carbG / RICE_BOWL.carbG)}공기** (~${RICE_BOWL.carbG}g/공기)`,
    kcal: `**${Math.round(kcal)} kcal** ≈ **${mealLabel} ${fmt(kcal / meal.kcal)}세트** (~${meal.kcal} kcal/세트)`,
  };
}

export function formatEnergyMarkdown(energy, lang) {
  if (!energy) return '';
  const L = lang === 'en';
  if (energy.skipped) {
    const d = energy.fitStartDeltaMin;
    return [
      L ? '### Energy (FIT HR estimate)' : '### 에너지 (FIT 심박 추정)',
      '',
      L
        ? `_Skipped: FIT vs Strava start differs by ${d} min (>15). Use a .fit from this ride._`
        : `_생략: FIT·Strava 시작 시각 차 ${d}분 (>15). **이 활동과 같은 라이드 .fit**을 넣어 주세요._`,
      '',
    ].join('\n');
  }
  const lines = [
    L ? '### Energy (FIT HR estimate)' : '### 에너지 (FIT 심박 추정)',
    '',
    `| ${L ? 'Item' : '항목'} | ${L ? 'Value' : '값'} |`,
    '|---|---|',
    `| ${L ? 'Duration' : '시간'} | ${energy.minutes.toFixed(1)} ${L ? 'min' : '분'} |`,
  ];
  if (energy.distanceKm) {
    lines.push(`| ${L ? 'Distance' : '거리'} | ${energy.distanceKm.toFixed(1)} km |`);
  }
  if (energy.avgHr) {
    lines.push(`| ${L ? 'Avg HR' : '평균 심박'} | ${energy.avgHr} bpm |`);
  }
  lines.push(
    `| **${L ? 'Total' : '추정 총 소모'}** | **${Math.round(energy.totalKcal)} kcal** |`,
    `| **${L ? 'Fat' : '지방'}** | **${energy.fatG.toFixed(1)} g** (${Math.round(energy.fatKcal)} kcal) |`,
    `| **${L ? 'Carbohydrate' : '탄수화물'}** | **${energy.carbG.toFixed(1)} g** (${Math.round(energy.carbKcal)} kcal) |`,
    `| ${L ? 'Fat share' : '지방 비율'} | ${(energy.fatFrac * 100).toFixed(0)}% |`,
  );
  if (energy.deviceKcal != null) {
    lines.push(`| ${L ? 'Device (FIT)' : '기기(FIT)'} | ${energy.deviceKcal} kcal |`);
  }
  const food = foodEquivalents(energy, lang);
  if (food) {
    lines.push(
      '',
      L ? '**Food equivalents (rough)**' : '**먹을거 감 (대략, ±많음)**',
      '',
      `- ${food.fat}`,
      `- ${food.carb}`,
      `- ${food.kcal}`,
    );
  }
  if (energy.fitStartDeltaMin != null && Math.abs(energy.fitStartDeltaMin) > 15) {
    lines.push(
      `| ${L ? 'FIT vs Strava start' : 'FIT·Strava 시작 차'} | ${energy.fitStartDeltaMin} ${L ? 'min' : '분'} |`,
    );
    lines.push(
      '',
      L
        ? '_Start times differ >15 min — use a .fit from the same ride. Segment kcal omitted._'
        : '_시작 시각 15분 이상 차이 — **같은 라이드 .fit**인지 확인. 세그먼트 kcal는 생략._',
    );
  }
  lines.push(
    '',
    L
      ? '_±20–30%. From FIT heart rate + Strava time/distance. Strava calorie not used._'
      : '_±20~30%. FIT 심박 + Strava 시간·거리. Strava 칼로리 미사용._',
    '',
  );
  return lines.join('\n');
}
