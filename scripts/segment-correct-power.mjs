#!/usr/bin/env node
/**
 * Per-segment recorded + corrected power from Strava activity + streams.
 */

import { readFile } from 'node:fs/promises';
import {
  CDA,
  CRR_DRY,
  CRR_WET,
  LOSS,
  buildPointsFromSlice,
  fetchWeather,
  formatElapsed,
  kstDateFromActivity,
  kstHourFromActivity,
  normalizeStreams,
  summarize,
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

function groupSections(efforts) {
  const counts = new Map();
  const rows = efforts.map((e) => {
    const n = (counts.get(e.name) ?? 0) + 1;
    counts.set(e.name, n);
    return { effort: e, occurrence: n };
  });

  const lap1Idx = rows.findIndex((r) => /down TT/i.test(r.effort.name));
  let lap2Idx = -1;
  if (lap1Idx >= 0) {
    for (let i = lap1Idx + 1; i < rows.length; i++) {
      if (rows[i].occurrence >= 2) {
        lap2Idx = i;
        break;
      }
    }
  }
  const returnIdx =
    lap2Idx >= 0
      ? rows.findIndex((r, i) => i > lap2Idx && /전재울|선수촌|모래네|작은구월/i.test(r.effort.name))
      : -1;

  return rows.map((r, idx) => {
    let section = 'other';
    if (returnIdx >= 0 && idx >= returnIdx) section = 'return';
    else if (lap2Idx >= 0 && idx >= lap2Idx) section = 'lap2';
    else if (lap1Idx >= 0 && idx >= lap1Idx) section = 'lap1';
    else section = 'warmup';
    return { ...r, section };
  });
}

function correctEffort(effort, streams, weather, massKg) {
  const start = effort.start_index ?? 0;
  const end = effort.end_index ?? start;
  const points = buildPointsFromSlice(streams, start, end, weather, massKg);
  const summary = summarize(points);
  return {
    name: effort.name,
    elapsedTime: effort.elapsed_time,
    grade: effort.segment?.average_grade,
    prRank: effort.pr_rank,
    stravaAvgW: effort.average_watts != null ? Math.round(effort.average_watts) : null,
    recordedW: summary?.rawAvgW,
    windDeltaW: summary?.windDeltaW,
    surfaceDeltaW: summary?.surfaceDeltaW,
    correctedW: summary?.zeroWindW,
    n: summary?.n ?? 0,
  };
}

function sectionTitle(section, lang) {
  if (lang === 'en') {
    if (section === 'warmup') return 'Warm-up / approach';
    if (section === 'lap1') return 'Lap 1';
    if (section === 'lap2') return 'Lap 2';
    if (section === 'return') return 'Return / finish';
    return 'Other segments';
  }
  if (section === 'warmup') return '출발 ~ 1회전 전';
  if (section === 'lap1') return '1회전';
  if (section === 'lap2') return '2회전';
  if (section === 'return') return '귀가 구간';
  return '기타 세그먼트';
}

function formatSegmentTable(rows, lang) {
  const h =
    lang === 'en'
      ? '| Segment | Time | Grade | Recorded W | **Corrected W** |'
      : '| 세그먼트 | 시간 | 경사 | 기록 파워 | **보정 파워** |';
  const sep = '|----------|------|------|-----------|---------------|';
  const body = rows.map((r) => {
    const grade = r.grade != null ? `${r.grade}%` : '—';
    const rec = r.recordedW ?? '—';
    const cor = r.correctedW ?? '—';
    return `| ${r.name} | ${formatElapsed(r.elapsedTime)} | ${grade} | ${rec} W | **${cor} W** |`;
  });
  return [h, sep, ...body].join('\n');
}

function formatMarkdown(out, lang) {
  const w = out.weather;
  const surface = out.surface === 'wet' ? (lang === 'en' ? 'wet' : '젖음') : lang === 'en' ? 'dry' : '건조';
  const lines = [
    lang === 'en' ? `## ${out.activityName} — segment power` : `## ${out.activityName} — 세그먼트 파워`,
    '',
    lang === 'en' ? '### Weather' : '### 날씨',
    `| ${lang === 'en' ? 'temp' : '기온'} | ${lang === 'en' ? 'precip' : '강수'} | ${lang === 'en' ? 'wind' : '풍속'} | ${lang === 'en' ? 'wind from' : '풍향'} | ${lang === 'en' ? 'surface' : '노면'} |`,
    `| ${w.tempC}°C | ${w.precipMm} mm | ${w.windKmh} km/h | ${w.windFromDeg}° (${w.windFromCardinal}) | ${surface} |`,
    '',
    lang === 'en' ? '### Whole ride' : '### 전체 라이딩',
    lang === 'en'
      ? `| Recorded W | Wind adj | **Corrected W** | Headwind % |`
      : `| 기록 파워 | 바람 보정 | **보정 파워** | 역풍 구간 |`,
    `| ${out.whole.rawAvgW} W | ${out.whole.windDeltaW > 0 ? '+' : ''}${out.whole.windDeltaW} W | **${out.whole.zeroWindW} W** | ${out.whole.headwindPct}% |`,
    '',
  ];

  const order = ['warmup', 'lap1', 'lap2', 'return', 'other'];
  for (const sec of order) {
    const rows = out.segments.filter((s) => s.section === sec);
    if (!rows.length) continue;
    lines.push(`### ${sectionTitle(sec, lang)}`, '', formatSegmentTable(rows, lang), '');
  }

  lines.push(
    lang === 'en'
      ? '_Estimated power ±10~15W. Recorded W = stream avg in segment window._'
      : '_추정 파워 ±10~15W. 기록 파워 = 세그먼트 구간 streams 평균._',
    '',
    lang === 'en' ? '**Reading:** corrected W > recorded W → headwind; corrected W < recorded W → tailwind.'
      : '**읽는 법:** 보정 > 기록 → 역풍 구간 · 보정 < 기록 → 순풍 구간',
  );
  return lines.join('\n');
}

async function main() {
  const args = parseArgs();
  const lang = args.lang === 'en' ? 'en' : 'ko';
  const format = args.format === 'json' ? 'json' : 'markdown';

  if (!args.activity || !args.streams) {
    console.error(
      lang === 'ko'
        ? '사용법: --activity ACTIVITY.json --streams STREAMS.json --lat --lng [--date] [--hour] [--rider] [--bike] [--format json|markdown]'
        : 'Usage: --activity ACTIVITY.json --streams STREAMS.json --lat --lng [--date] [--hour] [--rider] [--bike] [--format json|markdown]'
    );
    process.exit(1);
  }

  const activity = JSON.parse(await readFile(args.activity, 'utf8'));
  const rawStreams = JSON.parse(await readFile(args.streams, 'utf8'));
  const streams = normalizeStreams(rawStreams);
  const efforts = activity.segment_efforts ?? [];
  if (!efforts.length) throw new Error('activity has no segment_efforts');

  const riderKg = Number(args.rider ?? 74);
  const bikeKg = Number(args.bike ?? 10);
  const massKg = riderKg + bikeKg;
  const lat = Number(args.lat ?? activity.start_latlng?.[0]);
  const lng = Number(args.lng ?? activity.start_latlng?.[1]);
  const date = args.date ?? kstDateFromActivity(activity);
  const hour = Number(args.hour ?? kstHourFromActivity(activity));

  const weather = await fetchWeather(lat, lng, date, hour);
  const wholePoints = buildPointsFromSlice(streams, 0, streams.latlng.length - 1, weather, massKg);
  const whole = summarize(wholePoints);

  const grouped = groupSections(efforts);
  const segments = grouped.map(({ effort, section }) => ({
    section,
    ...correctEffort(effort, streams, weather, massKg),
  }));

  const surface = (weather.precipDayMm ?? 0) > 5 ? 'wet' : 'dry';
  const out = {
    activityId: activity.id,
    activityName: activity.name,
    date,
    hourKst: hour,
    weather,
    surface,
    riderKg,
    bikeKg,
    model: { cda: CDA, crrDry: CRR_DRY, crrWet: CRR_WET, loss: LOSS },
    whole,
    segments,
  };

  if (format === 'json') {
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  console.log(formatMarkdown(out, lang));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
