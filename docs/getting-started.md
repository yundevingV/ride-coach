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
ln -sf "$(pwd)/weather-power" ~/.cursor/skills/weather-power
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

### B. Segment analysis

```
analyze-cycle: Top 5 segment efforts from my recent ride in a table.
Time, grade, recorded power. State that it's estimated power.
```

### C. Wind correction

```
weather-power: Calculate zero-wind equivalent power for yesterday (or recent) ride.
Use Korean terms: 기록 파워, 바람 보정, 무풍 등가 파워.
```

### D. PR comparison (full package)

```
Compare PR segment vs this ride:
- Segment time (priority)
- Weather (temp, wind speed, direction)
- Zero-wind equivalent power
One-line conclusion + error range
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
2. **Zero-wind equivalent power** (weather-power)
3. **Recorded power** alone — forbidden
4. Flat raw W → FTP back-calc — forbidden

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
