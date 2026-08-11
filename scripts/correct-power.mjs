#!/usr/bin/env node
/**
 * 풍속·노면 보정 사이클링 파워 (Strava 추정 파워 기준)
 */

import {
  CDA,
  CRR_DRY,
  CRR_WET,
  LOSS,
  LABELS,
  buildPointsFromStreams,
  fetchWeather,
  formatElapsed,
  labelize,
  summarize,
  windCardinal8,
  windParallelKmh,
  aeroDeltaW,
  surfaceDeltaW,
} from './power-lib.mjs';

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

function formatMarkdown(out, lang) {
  const L = LABELS[lang] ?? LABELS.ko;
  const s = out.summary;
  const w = out.weather;
  const surface = out.surface === 'wet' ? L.surfaceWet : L.surfaceDry;
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
  if (s.climbZeroWindW != null) lines.push(`- ${L.climbZeroWindW}: ${s.climbZeroWindW}W`);
  if (s.flatZeroWindW != null) lines.push(`- ${L.flatZeroWindW}: ${s.flatZeroWindW}W`);
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
    const hour = Number(args.hour ?? 12);
    weather = await fetchWeather(args.lat, args.lng, args.date, hour);
    ({ points } = buildPointsFromStreams(streamData, weather, massKg));
  } else if (args.lat && args.date) {
    weather = await fetchWeather(args.lat, args.lng, args.date, Number(args.hour ?? 12));
    if (format === 'markdown') {
      console.log(`날씨만 조회됨: ${weather.hourLabel}, 풍속 ${weather.windKmh}km/h`);
      return;
    }
    console.log(
      JSON.stringify(
        {
          weather,
          note: lang === 'ko' ? '파워 보정은 --streams 또는 stdin JSON points가 필요합니다' : 'Provide --streams or stdin points',
        },
        null,
        2
      )
    );
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
