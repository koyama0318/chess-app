# Chess App

Rust/WASM + React チェスアプリ。Cloudflare Pages で静的配信。

## Tech Stack

- WASM: Rust, wasm-pack, wasm-bindgen
- UI: React 19, TypeScript, Vite
- Runtime: bun
- Deploy: Cloudflare Pages (GitHub Actions)
- CI: build, test, lint, type-check は CI で強制

## Architecture

```
React (UI) → Web Worker → WASM (Rust + Stockfish)
```

- WASM が唯一の正（局面管理、合法手生成、判定）
- UI はレンダリングとユーザー入力のみ
- localStorage でイベントソーシング（move event + FEN snapshot）

## Development Style

完全自律エージェントチーム開発。詳細は各 skill/agent 定義を参照。

- **idea-loop** x3: feature-request 生産、bolt 分解
- **impl-loop** x5: bolt 実装、TDD、レビュー、デプロイ
- **ops-loop** x1: 監視、修正、ナレッジ蓄積

## Issue Queue

GitHub issue をキューとして使用。

種別: `feature-request`, `bolt`, `guardrail`
状態: `ready`, `claimed`, `done`

claim 時は assignee 設定 + `claimed` ラベル付与で排他制御。

## Commands

```bash
bun run build        # wasm-pack build + vite build
bun run dev          # wasm-pack build + vite dev server
bun run build:wasm   # wasm-pack build only
bun run build:web    # vite build only
```

## Repo

- `wasm/` - Rust WASM crate
- `src/` - React UI
- `docs/adr/` - Architecture Decision Records
- `docs/knowledge/` - ナレッジベース
