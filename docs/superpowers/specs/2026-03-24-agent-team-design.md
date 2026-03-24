# Agent Team Design Spec

## Overview

チェスアプリを完全自律で開発するエージェントチーム構成。ユーザーは `/idea-loop`, `/implement-loop`, `/ops-loop` を起動するだけで、仕様策定からデプロイ・運用まで自律的に進行する。

## Design Decisions

- **縦スライス (bolt)**: デプロイ可能な単位でタスクを分割
- **Git Worktree**: bolt毎にworktreeで完全隔離、並列開発
- **完全自律**: 問題発見→修正→マージまでエージェントが自律実行
- **適応型ループ**: 各ループがissueキューの状態から次のアクションを自律判断
- **Issue駆動**: GitHub issueがキュー兼状態管理。ラベル2軸（種別×状態）
- **Contract-first**: inceptionでinterface定義をissueに記載、boltはそれに従う
- **CI統合**: ビルド・テスト・lint・型チェックはCI、デプロイ監視・stale検出はops-loop

## Issue Label Schema

### 種別ラベル
- `feature-request`: ユーザーまたはideatorからの要望
- `bolt`: 実装可能な縦スライス単位
- `guardrail`: operation改善タスク

### 状態ラベル
- `ready`: 着手可能
- `claimed`: エージェントが取得済み（assigneeで排他）
- `done`: 完了

## Team Structure

### idea-loop (x3 instances)

feature-requestの生産とbolt分解を担うチーム。

| Agent | Role |
|-------|------|
| analyst | plan.md・デプロイ済みアプリ・ナレッジを分析し、未実装機能やギャップを発見 |
| ideator | 新しい機能アイデアやアプローチを発散的に提案 |
| architect | bolt分解、contract設計、interface定義をissueに記載 |
| critic | アイデアやcontractの穴・矛盾・過剰設計を批評 |

**Flow:**
1. analyst が plan.md と現状の差分を分析
2. ideator が新アイデアを提案
3. critic がアイデアを批評・フィルタ
4. architect が生き残ったアイデアをboltに分解、contractをissueに記載
5. `bolt:ready` issueを作成

### impl-loop (x5 instances)

bolt:readyを消費し、実装→デプロイを担うチーム。

| Agent | Role |
|-------|------|
| coder | TDDでboltを実装（テスト先行） |
| quality-reviewer | コード品質、可読性、パフォーマンス、重複排除 |
| ux-reviewer | UI/UXの使い勝手、アクセシビリティ |
| architecture-reviewer | contractとの整合、レイヤー分離、設計一貫性 |

**Flow:**
1. `bolt:ready` issueをclaim（assignee設定 + `claimed`ラベル）
2. worktree作成
3. coder がTDDで実装（テスト→実装→リファクタ）
4. 3種のreviewerが並列レビュー
5. レビュー指摘をcoderが修正
6. テスト通過を確認
7. PR作成→自動マージ
8. issueを`done`に更新

### ops-loop (x1 instance)

デプロイ監視・品質維持・ナレッジ蓄積を担うチーム。

| Agent | Role |
|-------|------|
| monitor | デプロイ状態監視、stale issue検出 |
| fixer | 検出された問題の自動修正 |
| librarian | ADR・レビュー結果・知見をナレッジに変換 |

**Flow:**
1. monitor がデプロイ状態をチェック（Cloudflare Pages）
2. monitor がstale issue（claimed状態で長時間放置）を検出→再キュー
3. fixer がデプロイ失敗や品質問題を自動修正
4. librarian がADR、レビュー結果、開発知見をナレッジとして蓄積・整理

## Queue Flow

```
idea-loop x3 (生産)          impl-loop x5 (消費)         ops-loop x1 (維持)
    |                            |                           |
    +-> feature-request issue    |                           |
    +-> bolt分解 + contract      |                           |
    +-> bolt:ready issue作成 --> +-> claim (assigned)        |
    |                           +-> worktree作成              |
    |                           +-> TDD実装                   |
    |                           +-> 3種レビュー               |
    |                           +-> PR作成・自動マージ        |
    |                           +-> bolt:done                 |
    |                           |                        <---+-> デプロイ確認
    |                           |                            +-> stale検出->再キュー
    |                           |                            +-> ADR/知見->ナレッジ
    |                           |                            +-> ガードレール修正
```

## Conflict Resolution

- **排他制御**: issueのassignee設定で排他。claimedなissueは他インスタンスがスキップ
- **idea-loop間の重複防止**: 既存issueを確認してからfeature-request/bolt作成
- **コードコンフリクト**: worktreeで隔離。マージ時にコンフリクトが発生したらエージェントが自律的に解消

## File Structure

```
.claude/
  agents/
    idea-analyst.md
    idea-ideator.md
    idea-architect.md
    idea-critic.md
    impl-coder.md
    impl-quality-reviewer.md
    impl-ux-reviewer.md
    impl-architecture-reviewer.md
    ops-monitor.md
    ops-fixer.md
    ops-librarian.md
  skills/
    idea-loop.md
    implement-loop.md
    ops-loop.md
CLAUDE.md
REVIEW.md
docs/
  adr/          # Architecture Decision Records
  knowledge/    # ナレッジベース（librarianが管理）
```
