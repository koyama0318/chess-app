---
name: idea-loop
description: feature-request の生産と bolt 分解を行う自律ループ。plan.md と現状の差分を分析し、アイデアを生成・批評・bolt 化して GitHub issue に登録する。
---

# idea-loop

## Overview

plan.md と現在の実装状態のギャップを分析し、新しい feature-request と bolt を GitHub issue として生産するループ。

## Prerequisites

- GitHub CLI (`gh`) が認証済みであること
- リポジトリのオーナー/コラボレーター権限があること

## Loop Flow

```
START
  |
  v
[1. Check Queue] 既存の feature-request:ready が bolt 分解待ちか確認
  |
  +--> bolt 分解待ちあり --> [4. Architect] へスキップ
  |
  +--> なし --> 続行
  |
  v
[2. Analyze] analyst エージェントを実行
  - plan.md を読む
  - src/, wasm/ の現状を読む
  - GitHub issues (bolt:done, bolt:claimed) を確認
  - docs/knowledge/ を参照
  - ギャップリストと優先度を出力
  |
  v
[3. Ideate] ideator エージェントを実行
  - analyst のギャップリストを入力
  - 複数のアプローチを提案
  - 新規アイデアも提案
  |
  v
[3.5. Critique] critic エージェントを実行
  - ideator のアイデアリストを批評
  - approve / reject を判定
  - reject されたアイデアは除外
  |
  v
[4. Architect] architect エージェントを実行
  - 生き残ったアイデアを bolt に分解
  - contract (WASM API, Worker Messages, UI Interface) を定義
  - GitHub issue を作成:
    - ラベル: `bolt`, `ready`
    - body: contract + acceptance criteria
  |
  v
[4.5. Review Contract] critic エージェントで contract をレビュー
  - 問題があれば architect に差し戻し
  - 問題なければ続行
  |
  v
[5. Check Capacity] bolt:ready の issue 数を確認
  - 十分（5個以上）なら WAIT
  - 不足なら START に戻る
  |
  v
WAIT (次の loop 起動まで待機)
```

## Issue Creation Format

```bash
gh issue create \
  --title "bolt: <目的>" \
  --label "bolt,ready" \
  --body "$(cat <<'EOF'
## Contract

### WASM API
- `fn function_name(args) -> ReturnType`

### Worker Messages
- Request: `{ type: "message_type", payload: { ... } }`
- Response: `{ type: "response_type", payload: { ... } }`

### UI Interface
- Component: `ComponentName`
- Props: `{ ... }`

## Acceptance Criteria
- [ ] criteria 1
- [ ] criteria 2

## Dependencies
- Depends on: #issue_number (if any)

## Context
<analyst のギャップ分析と ideator の提案の要約>
EOF
)"
```

## Duplicate Prevention

issue 作成前に必ず既存 issue を検索:
```bash
gh issue list --label "bolt" --state open --json title,number
gh issue list --label "feature-request" --state open --json title,number
```

類似タイトルがあれば作成しない。

## Agent Definitions

各エージェントの詳細は `.claude/agents/` を参照:
- `idea-analyst.md`
- `idea-ideator.md`
- `idea-architect.md`
- `idea-critic.md`
