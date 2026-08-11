# AI 플랫폼별 설치

**English:** [platforms.md](platforms.md)

## 공통: 레포 클론

```bash
git clone https://github.com/yundevingV/ride-coach.git
cd ride-coach
```

온보딩: [getting-started.ko.md](./getting-started.ko.md)

---

## Cursor (권장 — Strava MCP + 스킬)

### 1. 스킬

```bash
mkdir -p ~/.cursor/skills
ln -sf "$(pwd)" ~/.cursor/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.cursor/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.cursor/skills/compare-cycle
```

### 2. Strava MCP

[setup-strava-mcp.ko.md](./setup-strava-mcp.ko.md) 전체 따라하기.

---

## Claude Code / Claude Desktop

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)" ~/.claude/skills/ride-coach
ln -sf "$(pwd)/analyze-cycle" ~/.claude/skills/analyze-cycle
ln -sf "$(pwd)/compare-cycle" ~/.claude/skills/compare-cycle
```

---

## ChatGPT / Gemini

`README.ko.md`, `prompts/system-prompt.ko.md`, `docs/segment-analysis.ko.md` 업로드.

---

## Windsurf / Codex

루트 `AGENTS.ko.md` 자동 인식.

---

## 스킬 역할

| 스킬 | 용도 |
|------|------|
| `ride-coach` | 허브·라이딩 코치 |
| `analyze-cycle` | 단일 라이딩·세그먼트 + 보정 파워 |
| `compare-cycle` | 날짜·PR 비교 |

세 개 모두 링크 권장.
