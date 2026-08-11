#!/usr/bin/env node
/**
 * 풍속·노면 보정 사이클링 파워 (Strava 추정 파워 기준)
 * Physics aligned with Omni Calculator cycling wattage model.
 */

const G = 9.80665;
const RHO0 = 1.225;
const CDA = 0.324;
const CRR_DRY = 0.005;
const CRR_WET = 0.0075;
const LOSS = 0.03;

const LABELS = {
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
    zeroWindW: '무풍 등가 파워(W)',
    climbZeroWindW: '업힐 무풍 등가(W)',
    flatZeroWindW: '평지 무풍 등가(W)',
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

function parseArgs() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    const token = a[i];
    if (!token.startsWith('--')) continue;
    const k = token.replace(/^--/, '');
    const next = a[i + 1];
    if (!next || next.startsWith('--')) {
      o[k] = true;
    } else {
      o[k] = next;
      i += 1;
    }
  }
  return o;
}

function rhoAtAlt(m = 0) {
  return RHO0 * Math.exp(-0.00011856 * m);
}

function bearingDeg(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function windCardinal8(deg) {
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}

function windParallelKmh(bearing, windFromDeg, windKmh) {
  const rad = ((bearing - windFromDeg) * Math.PI) / 180;
  return windKmh * Math.cos(rad);
}

function aeroDeltaW(vMps, wParallelMps, rho = RHO0) {
  const fa0 = 0.5 * CDA * rho * vMps * vMps;
  const faW = 0.5 * CDA * rho * (vMps + wParallelMps) ** 2;
  return (faW - fa0) * vMps;
}

function surfaceDeltaW(vMps, gradePct, massKg, wet) {
  const θ = Math.atan(gradePct / 100);
  const dCrr = (wet ? CRR_WET : CRR_DRY) - CRR_DRY;
  return massKg * G * dCrr * Math.cos(θ) * vMps;
}

function safeRound(n) {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n);
}

function avg(points, key) {
  const vals = points.map((p) => p[key]).filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function summarize(points) {
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

function labelize(obj, lang) {
  const L = LABELS[lang] ?? LABELS.ko;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = L[k] ?? k;
    out[key] = v;
  }
  return out;
}

async function fetchWeather(lat, lng, date, hour) {
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

function buildPointsFromStreams(streams, weather, massKg) {
  const latlng = streams.latlng?.data ?? streams.latlng;
  const vel = streams.velocity_smooth?.data ?? streams.velocity_smooth;
  const grade = streams.grade_smooth?.data ?? streams.grade_smooth;
  const watts = streams.watts?.data ?? streams.watts;
  if (!latlng || !vel) throw new Error('streams need latlng + velocity_smooth');

  const wet = weather.precipDayMm > 5 || weather.precipMm > 1;
  const points = [];

  for (let i = 1; i < latlng.length; i++) {
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
    points.push({
      vMps: v,
      grade: g,
      bearingDeg: Math.round(b),
      watts: wRaw,
      windDeltaW: dWind,
      surfaceDeltaW: dSurf,
      zeroWindW: wRaw + (dWind + dSurf) / (1 - LOSS),
      headwind: wPar > 0.5,
    });
  }
  return { points, wet };
}

function formatMarkdown(out, lang) {
  const L = LABELS[lang] ?? LABELS.ko;
  const s = out.summary;
  const w = out.weather;
  const surface =
    out.surface === 'wet' ? L.surfaceWet : L.surfaceDry;
  const lines = [
    '## 날씨·풍속 보정 파워',
    '',
    `### 날씨${w.hourLabel ? ` (${w.hourLabel})` : ''}`,
    `| ${L.tempC} | ${L.precipMm} | ${L.windKmh} | ${L.windFromDeg} | ${L.surface} |`,
    `| ${w.tempC} | ${w.precipMm} | ${w.windKmh} | ${w.windFromDeg} (${w.windFromCardinal ?? ''}) | ${surface} |`,
    '',
    '### 파워',
    `| ${L.rawAvgW} | ${L.windDeltaW} | ${L.surfaceDeltaW} | **${L.zeroWindW}** | ${L.headwindPct} |`,
    `| ${s.rawAvgW} | ${s.windDeltaW > 0 ? '+' : ''}${s.windDeltaW} | ${s.surfaceDeltaW ?? 0} | **${s.zeroWindW}** | ${s.headwindPct}% |`,
    '',
    `_Strava 추정 파워 기준. CdA·몸무게 가정 오차 ±10~15W._`,
  ];
  if (s.climbZeroWindW != null) {
    lines.push(`- ${L.climbZeroWindW}: ${s.climbZeroWindW}W`);
  }
  if (s.flatZeroWindW != null) {
    lines.push(`- ${L.flatZeroWindW}: ${s.flatZeroWindW}W`);
  }
  return lines.join('\n');
}

async function main() {
  const args = parseArgs();
  const lang = args.lang === 'en' ? 'en' : 'ko';
  const format = args.format === 'json' ? 'json' : args.markdown ? 'markdown' : args.format ?? 'markdown';

  let input = null;
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (raw) input = JSON.parse(raw);
  }

  let weather;
  let points;
  const riderKg = Number(input?.riderKg ?? args.rider ?? 74);
  const bikeKg = Number(input?.bikeKg ?? args.bike ?? 10);
  const massKg = riderKg + bikeKg;

  if (input?.points?.length) {
    weather = input.weather;
    if (!weather.windFromCardinal && weather.windFromDeg != null) {
      weather.windFromCardinal = windCardinal8(weather.windFromDeg);
    }
    const wet = (weather.precipMm ?? 0) > 1 || (weather.precipDayMm ?? 0) > 5;
    points = input.points.map((p) => {
      const wPar = windParallelKmh(p.bearingDeg, weather.windFromDeg, weather.windKmh) / 3.6;
      const dWind = aeroDeltaW(p.vMps, wPar);
      const dSurf = surfaceDeltaW(p.vMps, p.grade ?? 0, massKg, wet);
      return {
        ...p,
        windDeltaW: dWind,
        surfaceDeltaW: dSurf,
        zeroWindW: p.watts + (dWind + dSurf) / (1 - LOSS),
        headwind: wPar > 0.5,
      };
    });
  } else if (args.streams && args.lat && args.date) {
    const fs = await import('node:fs/promises');
    const raw = JSON.parse(await fs.readFile(args.streams, 'utf8'));
    const streamData = raw.data ?? raw;
    streamData.riderKg = riderKg;
    streamData.bikeKg = bikeKg;
    const hour = Number(args.hour ?? 12);
    weather = await fetchWeather(args.lat, args.lng, args.date, hour);
    ({ points } = buildPointsFromStreams(streamData, weather, massKg));
  } else if (args.lat && args.date) {
    weather = await fetchWeather(args.lat, args.lng, args.date, Number(args.hour ?? 12));
    const note =
      lang === 'ko'
        ? '파워 보정은 --streams 또는 stdin JSON points가 필요합니다'
        : 'Provide --streams or stdin points for power correction';
    if (format === 'markdown') {
      console.log(`날씨만 조회됨: ${weather.hourLabel}, 풍속 ${weather.windKmh}km/h`);
      return;
    }
    console.log(JSON.stringify({ weather, note }, null, 2));
    return;
  } else {
    console.error(
      lang === 'ko'
        ? '사용법: --lat --lng --date --hour --rider --bike --streams FILE | stdin JSON'
        : 'Usage: --lat --lng --date --hour --rider --bike --streams FILE | stdin JSON'
    );
    process.exit(1);
  }

  const summary = summarize(points);
  const surface = (weather.precipDayMm ?? 0) > 5 ? 'wet' : 'dry';
  const out = {
    weather,
    surface,
    riderKg,
    bikeKg,
    model: { cda: CDA, crrDry: CRR_DRY, crrWet: CRR_WET, loss: LOSS },
    summary,
    summaryLabels: labelize(summary, lang),
    weatherLabels: labelize({ ...weather, surface }, lang),
  };

  if (format === 'markdown') {
    console.log(formatMarkdown(out, lang));
    return;
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
