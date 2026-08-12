# Getting Started — 5-Minute Onboarding

**한국어:** [getting-started.ko.md](getting-started.ko.md)

Minimum path to use **segment analysis and wind-corrected power** with Strava + AI.

## Checklist

```
[ ] 1. git clone + skill links
[ ] 2. Strava MCP connection     → setup-strava-mcp.md
[ ] 3. Node.js 18+
[ ] 4. Test request to agent
```

---

## 1. Clone & skills

```bash
git clone https://github.com/yundevingV/ride-coach.git
cd ride-coach

mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.cursor/skills/compare-cycle
ln -sf "$(pwd)/estimate-ftp" ~/.cursor/skills/estimate-ftp
```

**Strava MCP** → [setup-strava-mcp.md](./setup-strava-mcp.md) **required**.

---

## 2. Node.js (power correction script)

```bash
node -v   # v18+

# Example
node scripts/correct-power.mjs --format json < examples/sample-input.json
```

---

## 3. First requests (copy into chat)

### A. Connection test

```
Check Strava MCP health and summarize my last 3 rides
```

### B. Single ride analysis

```
/analyze-cycle: Yesterday ride — weather, recorded power, corrected power,
top segment efforts in a table. State estimated power limits.
```

### C. PR comparison

```
/compare-cycle: PR segment vs this ride:
- Segment time (priority)
- Weather (temp, wind, direction)
- Corrected power diff
One-line conclusion + error range
```

### D. FTP estimate

```
/estimate-ftp or /predict-ftp:
- Recent 10 rides: uphill + flat corrected windows
- Profile FTP vs estimate range
- Confidence (low if Z2-only history)
```

---

## 4. Weight settings (estimated power users)

| Where | Typical meaning |
|-------|-----------------|
| Strava profile weight | **Body only** |
| Garmin etc. speedometer **single field** | Often **body + bike + gear total** |

- Body only → uphill **recorded power too low**
- `correct-power.mjs` default: profile body + bike **10kg**
- Adjust with `--rider 74 --bike 10` if needed

---

## 5. Analysis priority (all skills)

1. **Segment time** — most reliable
2. **Corrected power** (보정 파워) — built into analyze-cycle / compare-cycle
3. **FTP estimate** — estimate-ftp (`/predict-ftp`)
4. **Recorded power** alone — forbidden
5. Flat raw W → FTP back-calc — forbidden

Full segment workflow → [segment-analysis.md](./segment-analysis.md)

---

## 6. Doc map

| Doc | Content |
|-----|---------|
| [setup-strava-mcp.md](./setup-strava-mcp.md) | MCP install, OAuth, troubleshooting |
| [segment-analysis.md](./segment-analysis.md) | Segments, PR, FTP |
| [glossary.md](./glossary.md) | Terminology |
| [platforms.md](./platforms.md) | ChatGPT, Claude, etc. |
| [manual-strava-data.md](./manual-strava-data.md) | Without MCP |

---

## 7. Contributing & feedback

Issues and PRs welcome. Course/segment examples appreciated.

Bugs: MCP connection / script / unclear skill docs.
