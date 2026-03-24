# Autonomous Agent Development Cycle

プロジェクト非依存の、完全自律エージェントチームによる開発メソッド。

---

## Concept

人間はコマンドを呼ぶだけ。エージェントが自律的に仕様策定・実装・運用を行う。GitHub Issue をキューとして、複数のエージェントチームが並列で稼働する。

## Three Phases

### 1. Inception (何を作るか決める)

プロダクトの現状と仕様のギャップを分析し、実装可能な単位（bolt）に分解する。

- 仕様書と現状の差分分析
- アイデア生成と批評によるフィルタリング
- bolt への分解と contract（インターフェース定義）設計
- GitHub Issue として bolt:ready を登録

### 2. Construction (作る)

bolt を claim し、隔離環境で TDD 実装、レビュー、デプロイまで自律実行する。

- Issue キューから bolt:ready を claim（排他制御）
- Git Worktree で隔離
- TDD で実装（テスト先行）
- 複数観点のレビュー（並列）
- PR 作成・自動マージ

### 3. Operation (維持する)

デプロイ状態の監視、滞留タスクの再キュー、開発知見のナレッジ変換を行う。

- デプロイ監視と自動修正
- Stale issue の検出と再キュー
- ADR・レビュー結果からナレッジを蓄積・整理

## Team Types

### Idea Team

仕様と現状のギャップから bolt を生産するチーム。

| Agent     | Role                                             |
| --------- | ------------------------------------------------ |
| analyst   | 仕様と現状の差分を分析し、ギャップと優先度を特定 |
| ideator   | 新アイデアを発散的に提案                         |
| critic    | アイデアと contract の穴・矛盾・過剰設計を批評   |
| architect | bolt 分解、contract 設計、issue 作成             |

**Flow:** analyze → ideate → critique → architect → issue 作成

### Implementation Team

bolt を消費し、TDD で実装・レビュー・デプロイするチーム。

| Agent                 | Role                                    |
| --------------------- | --------------------------------------- |
| coder                 | TDD でテスト先行実装                    |
| quality-reviewer      | コード品質、可読性、パフォーマンス      |
| ux-reviewer           | UI/UX、アクセシビリティ                 |
| architecture-reviewer | contract 整合、レイヤー分離、設計一貫性 |

**Flow:** claim → worktree → TDD → parallel review → fix → PR → merge

### Operations Team

プロジェクトの健全性を維持し、知見を蓄積するチーム。

| Agent     | Role                                    |
| --------- | --------------------------------------- |
| monitor   | デプロイ監視、stale issue 検出          |
| fixer     | 検出問題の自動修正                      |
| librarian | ADR・レビュー結果・知見をナレッジに変換 |

**Flow:** monitor → fix → stale check → knowledge accumulation

## Queue System

GitHub Issue を2軸ラベルで管理するキューシステム。

### Type Labels (種別)

- `feature-request` - 機能要望（人間またはideatorが作成）
- `bolt` - 実装可能な縦スライス（architect が作成）
- `guardrail` - 運用改善タスク（monitor が作成）

### State Labels (状態)

- `ready` - 着手可能
- `claimed` - エージェントが取得済み
- `done` - 完了

### Exclusivity Control

- claim 時に assignee 設定 + `claimed` ラベル付与
- 既に claimed な issue は他チームがスキップ
- claim 後に assignee を再確認して競合を検出

## Bolt (縦スライス)

bolt はデプロイ可能な最小単位。以下を含む:

- **Contract**: インターフェース定義（API シグネチャ、メッセージ型、コンポーネント props）
- **Acceptance Criteria**: 受け入れ条件のチェックリスト
- **Dependencies**: 依存する他の bolt

bolt は issue の body に contract を記載し、implementation team がそれに従って実装する。

## Isolation Strategy

- **Git Worktree**: bolt 毎に worktree を作成し、完全隔離で並列開発
- **Contract-first**: inception で interface 定義を issue に記載、bolt はそれに従う
- **Merge-time conflict resolution**: コンフリクトはマージ時にエージェントが自律的に解消

## Adaptive Loop

各チームのメインループは適応型。キューの状態から次のアクションを自律判断する:

```
START
  |
  v
[Check Queue State]
  |
  +--> 自分の種別の ready issue あり --> 処理実行
  |
  +--> キューが空 --> 別フェーズの作業を検討 or WAIT
  |
  v
[Execute]
  |
  v
[Loop back to START]
```

## CI vs Operation の責務分担

| Concern                | Owner                | Trigger      |
| ---------------------- | -------------------- | ------------ |
| Build / Test           | CI (GitHub Actions)  | push / PR    |
| Lint / Type Check      | CI (GitHub Actions)  | push / PR    |
| Deploy Status          | ops-loop (monitor)   | periodic     |
| Stale Issue Detection  | ops-loop (monitor)   | periodic     |
| Auto Fix (CI failure)  | ops-loop (fixer)     | on detection |
| Knowledge Accumulation | ops-loop (librarian) | periodic     |

## Recommended Instance Counts

| Team           | Instances | Rationale                                |
| -------------- | --------- | ---------------------------------------- |
| Idea           | 3         | ギャップ分析とアイデア生成に十分な並列度 |
| Implementation | 5         | bolt 消費のスループットを最大化          |
| Operations     | 1         | 監視・修正・ナレッジは単一で十分         |

## Knowledge Cycle

開発中に蓄積される知見をナレッジに変換し、次の開発に活かすサイクル。

```
coder writes ADR
  |
reviewer leaves comments
  |
monitor logs ops events
  |
  v
librarian extracts patterns
  |
  v
knowledge base (patterns, pitfalls, decisions)
  |
  v
analyst reads knowledge --> better gap analysis
coder reads knowledge --> better implementation
```

## File Structure Convention

```
.claude/
  agents/
    idea-loop/        # analyst, ideator, architect, critic
    impl-loop/        # coder, quality-reviewer, ux-reviewer, architecture-reviewer
    ops-loop/         # monitor, fixer, librarian
  skills/
    idea-loop.md      # idea team loop flow
    implement-loop.md # implementation team loop flow
    ops-loop.md       # operations team loop flow
CLAUDE.md             # minimal system prompt
REVIEW.md             # review guidelines per reviewer type
docs/
  adr/                # Architecture Decision Records
  knowledge/          # Knowledge base (maintained by librarian)
```
