---
name: implement-loop
description: bolt:ready の issue を claim し、TDD で実装、3種レビュー、デプロイ、マージまで自律実行するループ。
---

# implement-loop

## Overview

GitHub issue キューから `bolt:ready` を取得し、worktree で隔離して TDD 実装 → 3種レビュー → PR → マージまで自律実行するループ。

## Prerequisites

- GitHub CLI (`gh`) が認証済みであること
- Git worktree が利用可能であること
- `bun`, `wasm-pack`, `cargo` がインストール済みであること

## Loop Flow

```
START
  |
  v
[1. Find Work] bolt:ready の issue を検索
  |
  +--> なし --> WAIT (次の loop 起動まで待機)
  |
  +--> あり --> 続行
  |
  v
[2. Claim] issue を claim
  - assignee を自分に設定
  - ラベルを `ready` -> `claimed` に変更
  - claim に失敗（既に claimed）なら [1] に戻る
  |
  v
[3. Setup Worktree]
  - main から新ブランチを作成: `bolt/<issue-number>-<slug>`
  - git worktree add で隔離環境を作成
  - worktree 内で作業開始
  |
  v
[4. Implement (TDD)] coder エージェントを実行
  - issue の contract と acceptance criteria を読む
  - Red: テストを先に書く
  - Green: テストが通る最小実装
  - Refactor: コード整理
  - `cargo test` + `bun run test` で全テスト通過を確認
  - `bun run build` でビルド確認
  |
  v
[5. Review] 3 種レビュアーを並列実行
  - quality-reviewer: コード品質チェック
  - ux-reviewer: UX チェック (UI 変更がない bolt は即 approve)
  - architecture-reviewer: contract 整合チェック
  |
  +--> request-changes あり --> coder が修正 --> [5] に戻る (最大 3 回)
  |
  +--> 3 回修正しても approve されない --> issue にコメントして unclaim、[1] に戻る
  |
  +--> 全員 approve --> 続行
  |
  v
[6. Create PR]
  - git push origin bolt/<issue-number>-<slug>
  - gh pr create (issue を closes で紐付け)
  |
  v
[7. Merge & Cleanup]
  - gh pr merge --squash
  - git worktree remove
  - issue ラベルを `done` に変更
  |
  v
[8. Loop] START に戻る
```

## Claim Protocol

排他制御のため、claim は atomic に行う:

```bash
# 1. ready な bolt を取得（最も古いものを優先）
ISSUE=$(gh issue list --label "bolt,ready" --json number,title --jq '.[0].number')

# 2. claim（assignee 設定 + ラベル変更）
gh issue edit "$ISSUE" --add-assignee "@me"
gh issue edit "$ISSUE" --remove-label "ready" --add-label "claimed"

# 3. 再確認（他のインスタンスと競合していないか）
ASSIGNEE=$(gh issue view "$ISSUE" --json assignees --jq '.assignees[0].login')
if [ "$ASSIGNEE" != "$(gh api user --jq '.login')" ]; then
  echo "Claim conflict, retrying..."
  # retry with next issue
fi
```

## Worktree Setup

```bash
BRANCH="bolt/${ISSUE_NUMBER}-${SLUG}"
git fetch origin main
git branch "$BRANCH" origin/main
git worktree add "../chess-app-${BRANCH}" "$BRANCH"
cd "../chess-app-${BRANCH}"
bun install
```

## PR Format

```bash
gh pr create \
  --title "bolt: <issue title>" \
  --body "$(cat <<'EOF'
Closes #<issue_number>

## Changes
<変更の要約>

## Test
- cargo test: PASS
- bun run test: PASS
- bun run build: PASS
EOF
)"
```

## Agent Definitions

各エージェントの詳細は `.claude/agents/` を参照:
- `impl-coder.md`
- `impl-quality-reviewer.md`
- `impl-ux-reviewer.md`
- `impl-architecture-reviewer.md`
