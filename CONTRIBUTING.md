# Contributing

**한국어:** [CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)

Contributions welcome to **ride-coach** — segment analysis and wind-corrected power skills.

## High-value PRs

- `docs/` — onboarding, MCP, regional course tips
- `examples/` — sample streams JSON, segment analysis examples
- Skill docs — prompt examples, output templates
- `scripts/correct-power.mjs` — bug fixes, Korean output

## Issues

- MCP connection failures (include platform and OS)
- Skills cannot read Strava
- Unclear terminology or documentation

## Principles

- Keep Strava **read-only**
- User-facing output uses **Korean terminology** ([docs/glossary.ko.md](docs/glossary.ko.md))
- Always state estimated-power limitations

## Local check

```bash
node scripts/correct-power.mjs < examples/sample-input.json
```

## Commits

Conventional Commits recommended: `docs:`, `fix:`, `feat:`
