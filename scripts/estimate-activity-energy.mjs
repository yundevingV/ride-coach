#!/usr/bin/env node
/** CLI wrapper for activity-energy.mjs (standalone .fit or manual inputs). */

import {
  estimateEnergy,
  formatEnergyMarkdown,
  loadFit,
} from './activity-energy.mjs';

function parseArgs() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].replace(/^--/, '');
    const n = a[i + 1];
    if (!n || n.startsWith('--')) o[k] = true;
    else {
      o[k] = n;
      i++;
    }
  }
  return o;
}

async function main() {
  const args = parseArgs();
  const lang = args.lang === 'en' ? 'en' : 'ko';
  let minutes = args.minutes ? Number(args.minutes) : null;
  let km = args.km ? Number(args.km) : null;
  let avgHr = args['avg-hr'] ? Number(args['avg-hr']) : null;
  let maxHr = Number(args['max-hr'] ?? 197);
  let deviceKcal = null;

  if (args.fit) {
    const f = await loadFit(args.fit);
    minutes = minutes ?? f.minutes;
    km = km ?? f.distanceKm;
    avgHr = avgHr ?? f.avgHr;
    if (!args['max-hr'] && f.maxHr) maxHr = f.maxHr;
    deviceKcal = f.deviceKcal;
  }

  const est = estimateEnergy({
    minutes,
    km,
    avgHr,
    maxHr,
    restingHr: Number(args['resting-hr'] ?? 60),
    weightKg: Number(args.weight ?? 73),
    age: Number(args.age ?? 30),
    sex: args.sex ?? 'm',
    sport: args.sport ?? 'cycle',
  });
  if (!est) {
    console.error('Need --minutes or --fit, and --avg-hr or --km');
    process.exit(1);
  }
  const out = { ...est, deviceKcal, fitStartDeltaMin: null };
  if (args.format === 'json') console.log(JSON.stringify(out, null, 2));
  else console.log(formatEnergyMarkdown(out, lang));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
