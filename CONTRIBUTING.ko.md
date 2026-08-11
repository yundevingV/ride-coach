# 기여하기

**English:** [CONTRIBUTING.md](CONTRIBUTING.md)

세그먼트 분석·풍속 보정 스킬 **ride-coach** 기여 환영.

## 도움이 큰 PR

- `docs/` — 온보딩·MCP·지역 코스 팁
- `examples/` — 샘플 streams JSON, 세그먼트 분석 예시
- 스킬 문서 — 프롬프트 예시, 출력 템플릿
- `scripts/correct-power.mjs` — 버그 수정·한글 출력

## 이슈

- MCP 연결 실패 (플랫폼·OS 명시)
- 스킬이 Strava를 못 읽는 경우
- 용어·문서 불명확

## 원칙

- Strava **read-only** 유지
- 사용자 출력은 **한글 용어** ([docs/glossary.ko.md](docs/glossary.ko.md))
- 추정 파워 한계 명시

## 로컬 확인

```bash
node scripts/correct-power.mjs < examples/sample-input.json
```

## 커밋

Conventional Commits 권장: `docs:`, `fix:`, `feat:`
