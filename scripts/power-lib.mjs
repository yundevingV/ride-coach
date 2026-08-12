/**
 * Shared wind/surface power correction (Strava estimated power).
 */

export const G = 9.80665;
export const RHO0 = 1.225;
export const CDA = 0.324;
export const CRR_DRY = 0.005;
export const CRR_WET = 0.0075;
export const LOSS = 0.03;

export const LABELS = {
  ko: {
    tempC: '기온(°C)',
    precipMm: '강수(mm)',
    precipDayMm: '당일 강수합(mm)',
    windKmh: '풍속(km/h)',
    windFromDeg: '풍향(바람 오는 방향,°)',
    hourLabel: '기준 시각',
    surface: '노면',
    surfaceDry: '건조',
    surfaceWet: '젖음',
    riderKg: '라이더(kg)',
    bikeKg: '바이크(kg)',
    n: '분석 포인트 수',
    rawAvgW: '기록 파워(W)',
    windDeltaW: '바람 보정(W)',
    surfaceDeltaW: '노면 보정(W)',
    zeroWindW: '보정 파워(W)',
    climbZeroWindW: '업힐 보정 파워(W)',
    flatZeroWindW: '평지 보정 파워(W)',
    headwindPct: '역풍 구간(%)',
    windFromCardinal: '풍향(8방)',
  },
  en: {
    tempC: 'tempC',
    precipMm: 'precipMm',
    precipDayMm: 'precipDayMm',
    windKmh: 'windKmh',
    windFromDeg: 'windFromDeg',
    hourLabel: 'hourLabel',
    surface: 'surface',
    surfaceDry: 'dry',
    surfaceWet: 'wet',
    riderKg: 'riderKg',
    bikeKg: 'bikeKg',
    n: 'n',
    rawAvgW: 'rawAvgW',
    windDeltaW: 'windDeltaW',
    surfaceDeltaW: 'surfaceDeltaW',
    zeroWindW: 'zeroWindW',
    climbZeroWindW: 'climbZeroWindW',
    flatZeroWindW: 'flatZeroWindW',
    headwindPct: 'headwindPct',
    windFromCardinal: 'windFromCardinal',
  },
};

export function bearingDeg(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function windCardinal8(deg) {
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}

export function windParallelKmh(bearing, windFromDeg, windKmh) {
  const rad = ((bearing - windFromDeg) * Math.PI) / 180;
  return windKmh * Math.cos(rad);
}

export function aeroDeltaW(vMps, wParallelMps, rho = RHO0) {
  const fa0 = 0.5 * CDA * rho * vMps * vMps;
  const faW = 0.5 * CDA * rho * (vMps + wParallelMps) ** 2;
  return (faW - fa0) * vMps;
}

export function surfaceDeltaW(vMps, gradePct, massKg, wet) {
  const θ = Math.atan(gradePct / 100);
  const dCrr = (wet ? CRR_WET : CRR_DRY) - CRR_DRY;
  return massKg * G * dCrr * Math.cos(θ) * vMps;
}

export function safeRound(n) {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n);
}

export function avg(points, key) {
  const vals = points.map((p) => p[key]).filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function summarize(points) {
  if (!points.length) return null;
  const climb = points.filter((p) => p.grade >= 3);
  const flat = points.filter((p) => Math.abs(p.grade) < 2 && p.vMps > 2);
  const headPct = Math.round((points.filter((p) => p.headwind).length / points.length) * 100);
  return {
    n: points.length,
    rawAvgW: safeRound(avg(points, 'watts')),
    windDeltaW: safeRound(avg(points, 'windDeltaW')),
    surfaceDeltaW: safeRound(avg(points, 'surfaceDeltaW')),
    zeroWindW: safeRound(avg(points, 'zeroWindW')),
    climbZeroWindW: climb.length ? safeRound(avg(climb, 'zeroWindW')) : null,
    flatZeroWindW: flat.length ? safeRound(avg(flat, 'zeroWindW')) : null,
    headwindPct: headPct,
  };
}

export function labelize(obj, lang) {
  const L = LABELS[lang] ?? LABELS.ko;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[L[k] ?? k] = v;
  }
  return out;
}

export async function fetchWeather(lat, lng, date, hour) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
    `&start_date=${date}&end_date=${date}` +
    `&hourly=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m` +
    `&timezone=Asia%2FSeoul`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j = await res.json();
  const times = j.hourly.time;
  let idx = times.findIndex((t) => t.startsWith(`${date}T${String(hour).padStart(2, '0')}`));
  if (idx < 0) idx = times.length - 1;
  const precipDay = j.hourly.precipitation.reduce((a, b) => a + b, 0);
  return {
    tempC: j.hourly.temperature_2m[idx],
    precipMm: j.hourly.precipitation[idx],
    precipDayMm: precipDay,
    windKmh: j.hourly.wind_speed_10m[idx],
    windFromDeg: j.hourly.wind_direction_10m[idx],
    hourLabel: times[idx],
    windFromCardinal: windCardinal8(j.hourly.wind_direction_10m[idx]),
  };
}

export function normalizeStreams(raw) {
  const data = raw.data ?? raw;
  return {
    latlng: data.latlng?.data ?? data.latlng,
    velocity_smooth: data.velocity_smooth?.data ?? data.velocity_smooth,
    grade_smooth: data.grade_smooth?.data ?? data.grade_smooth,
    watts: data.watts?.data ?? data.watts,
    time: data.time?.data ?? data.time,
  };
}

export function buildPointsFromSlice(streams, start, end, weather, massKg) {
  const { latlng, velocity_smooth: vel, grade_smooth: grade, watts } = streams;
  if (!latlng || !vel) throw new Error('streams need latlng + velocity_smooth');

  const wet = weather.precipDayMm > 5 || weather.precipMm > 1;
  const points = [];
  const lo = Math.max(0, start);
  const hi = Math.min(end, latlng.length - 1);

  for (let i = lo + 1; i <= hi; i++) {
    const [lat1, lon1] = latlng[i - 1];
    const [lat2, lon2] = latlng[i];
    const v = vel[i] ?? 0;
    if (v < 0.5) continue;
    const g = grade?.[i] ?? 0;
    const b = bearingDeg(lat1, lon1, lat2, lon2);
    const wPar = windParallelKmh(b, weather.windFromDeg, weather.windKmh) / 3.6;
    const wRaw = watts?.[i] ?? 0;
    const dWind = aeroDeltaW(v, wPar);
    const dSurf = surfaceDeltaW(v, g, massKg, wet);
    // Signed dWind for display (역풍 + / 순풍 −). 보정 파워 uses |dWind| so
    // tailwind segments correct upward (recorded low → true effort higher).
    const windAdj = Math.abs(dWind);
    points.push({
      vMps: v,
      grade: g,
      bearingDeg: Math.round(b),
      watts: wRaw,
      windDeltaW: dWind,
      surfaceDeltaW: dSurf,
      zeroWindW: wRaw + (windAdj + dSurf) / (1 - LOSS),
      headwind: wPar > 0.5,
    });
  }
  return points;
}

export function buildPointsFromStreams(streams, weather, massKg) {
  const s = normalizeStreams({ data: streams });
  const n = s.latlng?.length ?? 0;
  return { points: buildPointsFromSlice(s, 0, n - 1, weather, massKg), wet: weather.precipDayMm > 5 || weather.precipMm > 1 };
}

export function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function kstHourFromActivity(activity) {
  const local = activity.start_date_local ?? '';
  const m = local.match(/T(\d{2}):/);
  if (m) return Number(m[1]);
  const utc = activity.start_date ?? '';
  const mu = utc.match(/T(\d{2}):/);
  return mu ? Number(mu[1]) + 9 : 12;
}

export function kstDateFromActivity(activity) {
  const local = activity.start_date_local ?? activity.start_date ?? '';
  const m = local.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Standard peak-power windows (seconds). */
export const PEAK_DURATIONS_SEC = [
  { sec: 15, labelKo: '15초', labelEn: '15s' },
  { sec: 60, labelKo: '1분', labelEn: '1min' },
  { sec: 120, labelKo: '2분', labelEn: '2min' },
  { sec: 300, labelKo: '5분', labelEn: '5min' },
  { sec: 600, labelKo: '10분', labelEn: '10min' },
  { sec: 1200, labelKo: '20분', labelEn: '20min' },
  { sec: 3600, labelKo: '60분', labelEn: '60min' },
];

function maxRollingAvg(values, timeSec, durationSec) {
  if (!values.length) return null;
  const useTime = timeSec && timeSec.length === values.length;
  let best = 0;

  if (!useTime) {
    const minSamples = Math.max(3, Math.floor(durationSec * 0.5));
    if (values.length < minSamples) return null;
    for (let i = 0; i <= values.length - minSamples; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i; j < values.length && j < i + durationSec; j++) {
        sum += values[j] ?? 0;
        count += 1;
      }
      if (count >= minSamples) best = Math.max(best, sum / count);
    }
    return best > 0 ? Math.round(best) : null;
  }

  for (let i = 0; i < values.length; i++) {
    const t0 = timeSec[i];
    let sum = 0;
    let count = 0;
    let tEnd = t0;
    for (let j = i; j < values.length; j++) {
      tEnd = timeSec[j];
      if (tEnd - t0 > durationSec) break;
      sum += values[j] ?? 0;
      count += 1;
    }
    const span = tEnd - t0;
    if (count >= 3 && span >= durationSec * 0.9) {
      best = Math.max(best, sum / count);
    }
  }
  return best > 0 ? Math.round(best) : null;
}

/** Build per-sample recorded + corrected W aligned to stream indices (from index 1). */
export function buildCorrectedSeries(streams, weather, massKg) {
  const { latlng, velocity_smooth: vel, grade_smooth: grade, watts, time } = streams;
  if (!latlng?.length) return { recorded: [], corrected: [], timeSec: [] };

  const wet = weather.precipDayMm > 5 || weather.precipMm > 1;
  const recorded = [];
  const corrected = [];
  const timeSec = [];

  for (let i = 1; i < latlng.length; i++) {
    const wRaw = watts?.[i] ?? 0;
    const v = vel?.[i] ?? 0;
    recorded.push(wRaw);
    timeSec.push(time?.[i] ?? i - 1);

    if (v < 0.5) {
      corrected.push(wRaw);
      continue;
    }
    const [lat1, lon1] = latlng[i - 1];
    const [lat2, lon2] = latlng[i];
    const g = grade?.[i] ?? 0;
    const b = bearingDeg(lat1, lon1, lat2, lon2);
    const wPar = windParallelKmh(b, weather.windFromDeg, weather.windKmh) / 3.6;
    const dWind = aeroDeltaW(v, wPar);
    const dSurf = surfaceDeltaW(v, g, massKg, wet);
    corrected.push(wRaw + (Math.abs(dWind) + dSurf) / (1 - LOSS));
  }
  return { recorded, corrected, timeSec };
}

export function computePeakPowers(streams, weather, massKg, ftp = null) {
  const { recorded, corrected, timeSec } = buildCorrectedSeries(streams, weather, massKg);
  const elapsed =
    timeSec.length >= 2 ? timeSec[timeSec.length - 1] - timeSec[0] : recorded.length;

  const peaks = PEAK_DURATIONS_SEC
    .filter(({ sec }) => elapsed >= sec * 0.9)
    .map(({ sec, labelKo, labelEn }) => {
      const rec = maxRollingAvg(recorded, timeSec, sec);
      const cor = maxRollingAvg(corrected, timeSec, sec);
      const pct = ftp && cor ? Math.round((cor / ftp) * 100) : null;
      return { sec, labelKo, labelEn, recordedW: rec, correctedW: cor, ftpPct: pct };
    });

  return peaks;
}

export function formatPeakTable(peaks, lang, ftp = null) {
  if (!peaks?.length) return '';
  const h =
    lang === 'en'
      ? `| Duration | Recorded W | **Corrected W** |${ftp ? ' FTP % |' : ''}`
      : `| 구간 | 기록 파워 | **보정 파워** |${ftp ? ' FTP % |' : ''}`;
  const sep =
    lang === 'en'
      ? `|----------|------------|---------------|${ftp ? '-------|' : ''}`
      : `|------|-----------|---------------|${ftp ? '-------|' : ''}`;
  const rows = peaks
    .filter((p) => p.recordedW != null || p.correctedW != null)
    .map((p) => {
    const label = lang === 'en' ? p.labelEn : p.labelKo;
    const rec = p.recordedW ?? '—';
    const cor = p.correctedW ?? '—';
    const pct = p.ftpPct != null ? `${p.ftpPct}%` : '—';
    return ftp
      ? `| ${label} | ${rec} W | **${cor} W** | ${pct} |`
      : `| ${label} | ${rec} W | **${cor} W** |`;
  });
  return [h, sep, ...rows].join('\n');
}
