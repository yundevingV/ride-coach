# Strava MCP Setup (Cursor, Claude, etc.)

**한국어:** [setup-strava-mcp.ko.md](setup-strava-mcp.ko.md)

This skill bundle reads activities, segments, and streams via **Strava MCP**.  
Without setup, AI cannot fetch your Strava data.

## Requirements

| Item | Description |
|------|-------------|
| Strava account | Account with ride history |
| Cursor (recommended) | MCP + Agent Skills support |
| Node.js 18+ | For `correct-power.mjs` |

AI without MCP (ChatGPT etc.) → [manual-strava-data.md](./manual-strava-data.md).

---

## 1. Repo + skills

```bash
git clone https://github.com/yundevingV/ride-coach.git
cd ride-coach

mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.cursor/skills/compare-cycle
```

Claude Code:

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)" ~/.claude/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.claude/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.claude/skills/compare-cycle
```

---

## 2. Cursor MCP setup

### 2-1. Edit `mcp.json`

Path: **`~/.cursor/mcp.json`** (create if missing)

```json
{
  "mcpServers": {
    "strava": {
      "url": "https://strava-mcp.mikekeefe.workers.dev/mcp"
    }
  }
}
```

> Cursor UI shows **`user-strava`**. Skill docs' `user-strava` = this `strava` config.

### 2-2. Restart Cursor

Save `mcp.json` and restart Cursor or refresh MCP list.

### 2-3. Connect Strava (OAuth)

1. **Cursor Settings** → **MCP** (or **Features → MCP**)
2. Find `strava` / `user-strava` server
3. Click **Connect** / **Authorize** / **Needs authentication**
4. Strava login and grant permissions
5. Status **ready** / green = done

Agent may request `mcp_auth` in chat — approve when prompted.

### 2-4. Verify connection

Ask the agent:

```
Check Strava MCP health
```

Or in **agent chat** (not terminal):

- `get_athlete_profile` → name, weight, FTP
- `get_recent_activities` → recent rides

Success: athlete id, recent Ride list JSON.

---

## 3. Strava MCP tools (segments & analysis)

| Tool | Use |
|------|-----|
| `health` | Connection, rate limit, cache |
| `get_athlete_profile` | Weight, FTP |
| `get_recent_activities` | Recent ride list |
| `get_activity_details` | Segment efforts, start time/coords, recorded power |
| `get_activity_streams` | GPS, speed, grade, watts (required for wind correction) |
| `get_segment_details` | Distance, grade, PR |
| `explore_segments` | Search segments by area |
| `list_my_segment_efforts` | Past efforts on a segment |
| `get_athlete_stats` | Weekly / yearly stats |

**No write API** — cannot modify or upload activities (read-only).

---

## 4. Skill combinations (recommended)

| Skill | Role |
|-------|------|
| **ride-coach** | Hub, entry point |
| **analyze-cycle** | Single ride / segment — weather + corrected power |
| **compare-cycle** | PR vs today, cross-day comparison |

Example requests:

- "Yesterday ride analysis" → analyze-cycle
- "Recent segment PR on course X" → analyze-cycle
- "PR day vs today: time + corrected power" → compare-cycle

---

## 5. Troubleshooting

### MCP `needsAuth` / connection failed

- Settings → MCP → Strava **reconnect**
- Restart Cursor
- Check `mcp.json` URL typos

### `user-strava` tools not visible

- Confirm `strava` entry in `~/.cursor/mcp.json`
- If MCP status is **error**, check logs

### Rate limit

- `health` → `shortTermUsage` / `dailyUsage`
- Streams use many API calls per activity → cached on repeat

### No `latlng` in streams

- Wind correction confidence **drops sharply**
- Analyze by segment **time** (analyze-cycle default)

### Weight / power looks wrong

- Strava profile weight = **body only** (bike not included)
- Speedometer setting often = rider + bike total → [getting-started.md](./getting-started.md) weight section

---

## 6. Custom MCP server

If you use a custom Strava MCP, **tool names** may differ.

Required **capabilities**:

- Activity list / detail / streams (latlng, velocity_smooth, grade_smooth, watts)
- Segment search / detail / my efforts
- Profile (weight, ftp)

Add a mapping table to `AGENTS.md` if names differ.

---

## 7. Security & permissions

- Strava OAuth = **read your account** only
- Do not commit tokens to public repos (example uses public URL only)
- Teams: each person connects their own Strava

Next: [Getting started](./getting-started.md)
