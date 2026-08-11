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
