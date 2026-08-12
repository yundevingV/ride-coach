# Using Strava Data Without MCP

**한국어:** [manual-strava-data.ko.md](manual-strava-data.ko.md)

For **environments without Strava MCP** — ChatGPT, Gemini, etc.

## Required data

### Activity meta (minimum)

- `start_date_local` (KST)
- `start_latlng` [lat, lng]
- `average_watts` / `weighted_average_watts`
- `segment_efforts` (for segment analysis)

### streams JSON (for wind correction)

Same fields as `get_activity_streams`:

```json
{
  "latlng": [[37.46, 126.70], ...],
  "velocity_smooth": [6.5, ...],
  "grade_smooth": [2.1, ...],
  "watts": [101, ...]
}
```

Strava API v3: `GET /activities/{id}/streams?keys=latlng,velocity_smooth,grade_smooth,watts&key_by_type=true`

With MCP → use `format: "arrays"` and include `latlng` in `stream_types` ([setup-strava-mcp.md](./setup-strava-mcp.md)).

---

## When GPS (`latlng`) is missing

**Corrected power** needs per-second **bearing from GPS**. If missing, follow this order.

### 1. Retry MCP fetch (most common fix)

Some MCP servers omit `latlng` unless you pass **`format: "arrays"`** and **`stream_types`**.

### 2. Find the cause

| Cause | How to tell | Notes |
|-------|-------------|-------|
| MCP params | `metadata.returned_types` has no latlng | Fix with §1 |
| Riduck `stripped_*.fit` | `external_id` / description links to riduck | Often **start/end hidden only**; streams may still have GPS |
| Indoor / trainer | `trainer: true` | No correction → **time** only |
| Manual activity | `manual: true` | No GPS |
| GPS off on device | Original FIT/GPX has no coords | §3 |

### 3. Supplement with GPX / FIT

**GPX alone is not enough.** GPX = track, time, (elevation). **Power (W)** must come from Strava `watts` streams or FIT.

| Step | Action |
|------|--------|
| A | Export **original FIT** or **GPX** from head unit (pre-upload file) |
| B | Fetch **watts + time** streams via Strava MCP |
| C | **Align** GPX coordinates to watt samples by timestamp |
| D | Pass merged JSON to `segment-correct-power.mjs` as `--streams` |

Minimum streams JSON:

```json
{
  "data": {
    "latlng": [[37.457, 126.709], ...],
    "velocity_smooth": [6.5, ...],
    "grade_smooth": [0.1, ...],
    "watts": [101, ...],
    "time": [0, 1, 2, ...]
  }
}
```

Strava web **GPX export** may be sparse; prefer **original FIT/GPX** from the device.

### 4. Segment bearing approximation (last resort)

When no stream latlng and no GPX:

- Use `segment_efforts[].segment.start_latlng` → `end_latlng` **bearing** per segment
- **Low confidence** — loops and short segments drift
- State **「GPS approximate, ±15W+」** in the analysis

### 5. Skip correction

If none of the above works:

- Analyze **segment time, grade, recorded power** only
- Omit corrected power or mark **「N/A」**
- PR / fitness → **time** first (analyze-cycle default)

---

## How to pass to AI

1. Upload repo `prompts/system-prompt.md` + `docs/glossary.md`
2. Paste streams JSON or activity ID / manual table
3. Or run script locally and paste results:

```bash
node scripts/correct-power.mjs \
  --lat 37.46 --lng 126.70 \
  --date 2026-08-10 --hour 20 \
  --rider 74 --bike 10 \
  --streams ./my-streams.json
```

## Segments only (no streams)

Copy segment time/grade from Strava app/web, or  
provide `segment_efforts` JSON to AI.

**Time and grade** analysis works without streams (no wind correction).

## Strava API directly (developers)

1. Create app at https://www.strava.com/settings/api
2. OAuth access token
3. curl activities / streams

This repo does not include token management.  
Use for personal scripts or separate MCP server.

If MCP is possible → prefer [setup-strava-mcp.md](./setup-strava-mcp.md).
