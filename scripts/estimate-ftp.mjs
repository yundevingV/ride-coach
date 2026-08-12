#!/usr/bin/env node
/**
 * FTP estimate from recent rides: uphill + flat threshold windows (corrected power).
 */

import { readFile } from 'node:fs/promises';
import {
  buildCorrectedSeries,
  fetchWeather,
  kstDateFromActivity,
  kstHourFromActivity,
  normalizeStreams,
} from './power-lib.mjs';

const UPHILL_DURATIONS_SEC = [180, 240, 300, 360, 480];
const FLAT_DURATION_SEC = 1200;
const POOL_SIZE = 5;
const WEIGHT_UPHILL = 0.55;
const WEIGHT_FLAT = 0.45;
const UPHILL_INTENSITY = 0.85;
const FLAT_INTENSITY = 0.75;
const UPHILL_FTP_DIV = 1.1;
const FLAT_FTP_FACTOR = 0.95;

function parseArgs() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    const token = a[i];
    if (!token.startsWith('--')) continue;
    const k = token.replace(/^--/, '');
    const next = a[i + 1];
    if (!next || next.startsWith('--')) o[k] = true;
    else {
      o[k] = next;
      i += 1;
    }
  }
  return o;
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function topN(items, n, key) {
  return [...items].sort((a, b) => b[key] - a[key]).slice(0, n);
}

function bestWindow(corrected, recorded, grade, timeSec, durationSec, { minGrade, maxAbsGrade, minAvgW, minRecordedW }) {
  let best = null;
  for (let i = 0; i < timeSec.length; i++) {
    const t0 = timeSec[i];
    let sumW = 0;
    let sumR = 0;
    let sumG = 0;
    let count = 0;
    let lastT = t0;
    for (let j = i; j < timeSec.length; j++) {
      lastT = timeSec[j];
      if (lastT - t0 > durationSec) break;
      sumW += corrected[j] ?? 0;
      sumR += recorded?.[j] ?? 0;
      sumG += grade[j] ?? 0;
      count += 1;
    }
    const span = lastT - t0;
    if (count < 3 || span < durationSec * 0.9) continue;
    const avgW = sumW / count;
    const avgR = sumR / count;
    const avgG = sumG / count;
    if (minGrade != null && avgG < minGrade) continue;
    if (maxAbsGrade != null && Math.abs(avgG) > maxAbsGrade) continue;
    if (minAvgW != null && avgW < minAvgW) continue;
    if (minRecordedW != null && avgR < minRecordedW) continue;
    const cand = {
      avgCorrected: avgW,
      avgRecorded: avgR,
      avgGrade: avgG,
      durationSec: Math.round(span),
      startSec: t0,
    };
    if (!best || avgW > best.avgCorrected) best = cand;
  }
  return best;
}

function alignedGrade(streams) {
  const g = streams.grade_smooth;
  if (!g?.length) return null;
  return g.slice(1);
}

async function analyzeRide(activity, streamsRaw, profileFtp, riderKg, bikeKg) {
  const streams = normalizeStreams(streamsRaw);
  if (!streams.latlng?.length || !streams.watts?.length) {
    return { activity, skip: 'no_gps_or_watts', uphill: [], flat: [] };
  }

  const date = kstDateFromActivity(activity ?? {});
  const hour = kstHourFromActivity(activity ?? {});
  if (!date) return { activity, skip: 'no_date', uphill: [], flat: [] };

  const [lat, lng] = streams.latlng[0];
  const weather = await fetchWeather(lat, lng, date, hour);
  const massKg = riderKg + bikeKg;
  const { corrected, recorded, timeSec } = buildCorrectedSeries(streams, weather, massKg);
  const grade = alignedGrade(streams);
  if (!grade?.length || !corrected.length) {
    return { activity, skip: 'no_grade', uphill: [], flat: [] };
  }

  const meta = {
    id: activity?.id ?? null,
    name: activity?.name ?? null,
    date,
  };

  let bestUphill = null;
  for (const sec of UPHILL_DURATIONS_SEC) {
    const w = bestWindow(corrected, recorded, grade, timeSec, sec, {
      minGrade: 3,
      minAvgW: profileFtp * UPHILL_INTENSITY,
    });
    if (w && (!bestUphill || w.avgCorrected > bestUphill.avgCorrected)) {
      bestUphill = { ...w, targetSec: sec };
    }
  }

  const uphill = bestUphill
    ? [
        {
          ...bestUphill,
          ...meta,
          kind: 'uphill',
          ftpEst: Math.round(bestUphill.avgCorrected / UPHILL_FTP_DIV),
        },
      ]
    : [];

  const flat = [];
  const fw = bestWindow(corrected, recorded, grade, timeSec, FLAT_DURATION_SEC, {
    maxAbsGrade: 1,
    minAvgW: profileFtp * FLAT_INTENSITY,
    minRecordedW: profileFtp * 0.78,
  });
  if (fw) {
    flat.push({
      ...fw,
      ...meta,
      kind: 'flat',
      targetSec: FLAT_DURATION_SEC,
      ftpEst: Math.round(fw.avgCorrected * FLAT_FTP_FACTOR),
    });
  }

  return { activity, uphill, flat, skip: null };
}

function combinePools(allUphill, allFlat, profileFtp) {
  const uphillTop = topN(allUphill, POOL_SIZE, 'avgCorrected');
  const flatTop = topN(allFlat, POOL_SIZE, 'avgCorrected');
  const uMed = median(uphillTop.map((x) => x.ftpEst));
  const fMed = median(flatTop.map((x) => x.ftpEst));

  let weighted = null;
  if (uMed != null && fMed != null) weighted = Math.round(uMed * WEIGHT_UPHILL + fMed * WEIGHT_FLAT);
  else if (fMed != null) weighted = fMed;
  else if (uMed != null && profileFtp && uMed >= profileFtp * 0.88) weighted = uMed;
  else if (profileFtp) weighted = profileFtp;

  const allEst = [...uphillTop, ...flatTop].map((x) => x.ftpEst);
  const range = allEst.length ? { lo: Math.min(...allEst), hi: Math.max(...allEst) } : null;

  let confidence = 'low';
  if (uMed != null && fMed != null && uphillTop.length >= 3 && flatTop.length >= 2) confidence = 'high';
  else if (fMed != null || (uMed != null && profileFtp && uMed >= profileFtp * 0.88)) confidence = 'medium';

  return { weighted, range, confidence, uphillMedian: uMed, flatMedian: fMed, uphillTop, flatTop };
}

function formatPoolTable(items, lang) {
  const L = lang === 'en';
  if (!items.length) return L ? '_No qualifying windows._' : '_해당 구간 없음._';
  const lines = [
    L
      ? '| Ride | Window | Grade% | Corrected W | FTP est. |'
      : '| 라이딩 | 구간 | 경사% | 보정 파워 | FTP 추정 |',
    L ? '|------|--------|--------|-------------|----------|' : '|--------|------|-------|-----------|----------|',
  ];
  for (const x of items) {
    const label = x.name ? `${x.name.slice(0, 20)}` : `#${x.id ?? '?'}`;
    const dur = Math.round(x.durationSec / 60);
    lines.push(
      `| ${label} | ${dur}min | ${x.avgGrade.toFixed(1)} | **${Math.round(x.avgCorrected)} W** | ${x.ftpEst} W |`,
    );
  }
  return lines.join('\n');
}

function formatMarkdown(out, lang) {
  const L = lang === 'en';
  const e = out.estimate;
  const lines = [
    L ? '## FTP estimate' : '## FTP 추정',
    '',
    L ? '### Summary' : '### 요약',
    L ? '| | |' : '| | |',
    L ? '|---|---|' : '|---|---|',
  ];
  if (out.profileFtp) {
    lines.push(L ? `| Profile FTP | ${out.profileFtp} W |` : `| 프로필 FTP | ${out.profileFtp} W |`);
  }
  lines.push(
    L ? `| **Estimate** | **${e.weighted} W** |` : `| **추정** | **${e.weighted} W** |`,
  );
  if (e.range) {
    lines.push(
      L
        ? `| Range (pool spread) | ${e.range.lo}–${e.range.hi} W |`
        : `| 구간 spread | ${e.range.lo}–${e.range.hi} W |`,
    );
  }
  lines.push(L ? `| Confidence | ${e.confidence} |` : `| 신뢰도 | ${e.confidence} |`);
  if (out.wKg) {
    lines.push(L ? `| W/kg | ${out.wKg} |` : `| W/kg | ${out.wKg} |`);
  }
  lines.push('');
  lines.push(L ? '### Uphill pool (top 5, grade ≥3%)' : '### 업힐 풀 (상위 5, 경사 ≥3%)');
  lines.push(formatPoolTable(e.uphillTop, lang));
  lines.push('');
  lines.push(
    L
      ? '### Flat pool (top 5, 20min+, grade <1%, ≥75% FTP intensity)'
      : '### 평지 풀 (상위 5, 20분+, 경사 <1%, 강도 ≥75% FTP)',
  );
  lines.push(formatPoolTable(e.flatTop, lang));
  lines.push('');
  lines.push(
    L
      ? `_Corrected power windows from ${out.rideCount} ride(s). Uphill ÷1.1, flat ×0.95. Weights: uphill ${WEIGHT_UPHILL}, flat ${WEIGHT_FLAT}. Z2 rides excluded by intensity gate._`
      : `_최근 ${out.rideCount}회 라이딩 **보정 파워** 구간. 업힐 ÷1.1, 평지 ×0.95. 가중: 업힐 ${WEIGHT_UPHILL}, 평지 ${WEIGHT_FLAT}. Z2는 강도 필터로 제외._`,
  );
  return lines.join('\n');
}

async function loadManifest(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  const args = parseArgs();
  const lang = args.lang === 'en' ? 'en' : 'ko';
  const format = args.format === 'json' ? 'json' : 'markdown';

  let rides = [];
  let profileFtp = Number(args['profile-ftp']) || null;
  let riderKg = Number(args.rider) || 74;
  let bikeKg = Number(args.bike) || 10;

  if (args.manifest) {
    const m = await loadManifest(args.manifest);
    profileFtp = profileFtp ?? m.profileFtp ?? m.profile_ftp ?? null;
    riderKg = Number(args.rider ?? m.riderKg ?? m.rider_kg ?? riderKg);
    bikeKg = Number(args.bike ?? m.bikeKg ?? m.bike_kg ?? bikeKg);
    rides = m.rides ?? [];
  } else if (args.streams) {
    const streamsRaw = JSON.parse(await readFile(args.streams, 'utf8'));
    let activity = {};
    if (args.activity) activity = JSON.parse(await readFile(args.activity, 'utf8'));
    profileFtp = profileFtp ?? (Number(activity?.athlete?.ftp) || null);
    riderKg = Number(args.rider ?? activity?.athlete?.weight ?? riderKg);
    rides = [{ activity, streams: streamsRaw }];
  } else {
    console.error(
      'Usage:\n' +
        '  --manifest RIDES.json [--profile-ftp 178] [--rider 74] [--bike 10]\n' +
        '  --streams STREAMS.json --activity ACTIVITY.json [--profile-ftp 178]',
    );
    process.exit(1);
  }

  if (!profileFtp) {
    console.error('profile-ftp required (or in manifest / activity.athlete.ftp)');
    process.exit(1);
  }

  const allUphill = [];
  const allFlat = [];
  const analyzed = [];

  for (const r of rides) {
    let activity = r.activity ?? {};
    let streamsRaw = r.streams;
    if (typeof streamsRaw === 'string') {
      streamsRaw = JSON.parse(await readFile(streamsRaw, 'utf8'));
    }
    if (typeof activity === 'string') {
      activity = JSON.parse(await readFile(activity, 'utf8'));
    }
    const result = await analyzeRide(activity, streamsRaw, profileFtp, riderKg, bikeKg);
    analyzed.push(result);
    allUphill.push(...result.uphill);
    allFlat.push(...result.flat);
  }

  const estimate = combinePools(allUphill, allFlat, profileFtp);
  const out = {
    profileFtp,
    riderKg,
    bikeKg,
    rideCount: rides.length,
    wKg: estimate.weighted ? (estimate.weighted / riderKg).toFixed(2) : null,
    estimate,
    analyzed: analyzed.map(({ activity, skip, uphill, flat }) => ({
      id: activity?.id,
      name: activity?.name,
      skip,
      uphillCount: uphill.length,
      flatCount: flat.length,
    })),
  };

  if (format === 'json') console.log(JSON.stringify(out, null, 2));
  else console.log(formatMarkdown(out, lang));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
