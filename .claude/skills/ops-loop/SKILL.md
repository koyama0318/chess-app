---
name: ops-loop
description: デプロイ監視、stale issue 検出、自動修正、ナレッジ蓄積を行う自律ループ。定期的に実行され、プロジェクトの健全性を維持する。
---

# ops-loop

## Overview

デプロイ状態の監視、stale issue の再キュー、問題の自動修正、ADR/レビュー結果のナレッジ変換を行う定期実行ループ。

## Prerequisites

- GitHub CLI (`gh`) が認証済みであること
- リポジトリのオーナー/コラボレーター権限があること

## Loop Flow

```
START
  |
  v
[1. Monitor Deploy] monitor エージェントを実行
  - gh run list で最新の CI 状態を確認
  - 失敗があれば詳細を取得
  |
  +--> 失敗あり --> [2. Fix] へ
  |
  +--> 正常 --> [3] へ
  |
  v
[2. Fix] fixer エージェントを実行
  - 失敗原因を分析
  - ブランチ作成 → 修正 → テスト → PR → マージ
  - 修正内容を ops-log に記録
  |
  v
[3. Check Stale Issues] monitor エージェントを実行
  - claimed ラベルの issue を一覧取得
  - claimed から 1 時間以上経過しているものを検出
  |
  +--> stale あり --> assignee 解除、ready に戻す、コメント記載
  |
  +--> なし --> 続行
  |
  v
[4. Accumulate Knowledge] librarian エージェントを実行
  - 新しい ADR を読み、要約をナレッジに追加
  - 最近クローズされた PR のレビューコメントを収集
  - パターン抽出 → docs/knowledge/ を更新
  |
  v
[5. Report] 実行結果のサマリーを ops-log に追記
  |
  v
WAIT (次の loop 起動まで待機)
```

## Monitor Commands

```bash
# CI 状態確認
gh run list --limit 5 --json status,conclusion,name,createdAt

# 失敗した run の詳細
gh run view <run_id> --log-failed

# Stale issue 検出
gh issue list --label "bolt,claimed" --json number,title,assignees,updatedAt
```

## Stale Issue Protocol

```bash
# 1 時間以上 claimed のまま更新がない issue を検出
STALE=$(gh issue list --label "bolt,claimed" --json number,updatedAt \
  --jq '[.[] | select(
    (now - (.updatedAt | fromdateiso8601)) > 3600
  )] | .[].number')

for ISSUE in $STALE; do
  gh issue edit "$ISSUE" --remove-label "claimed" --add-label "ready"
  gh issue edit "$ISSUE" --remove-assignee ""
  gh issue comment "$ISSUE" --body "Reclaimed: stale for >1h. Returned to ready queue."
done
```

## Knowledge Files

librarian が管理するファイル:

- `docs/knowledge/patterns.md` - 承認されたコーディングパターン集
- `docs/knowledge/pitfalls.md` - よくある落とし穴と回避策
- `docs/knowledge/decisions.md` - 設計判断の要約（ADR のダイジェスト）
- `docs/knowledge/ops-log.md` - 運用ログ（monitor/fixer の実行記録）

## Agent Definitions

各エージェントの詳細は `.claude/agents/` を参照:
- `ops-monitor.md`
- `ops-fixer.md`
- `ops-librarian.md`
