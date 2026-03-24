# ADR-002: Stockfish を chess Worker の子 Worker として実行する

## Status

Accepted

## Context

Human vs CPU モードに対応するため、Stockfish (UCI エンジン) を導入する必要がある。
Stockfish は JS ビルド (`stockfish-18-lite-single.js`) として提供されており、Worker として実行する必要がある。
配置方法として以下の選択肢があった:

1. **Sibling Worker**: UI スレッドが chess Worker と Stockfish Worker を別々に管理する
2. **Nested Worker**: chess Worker が Stockfish Worker を子 Worker として生成・管理する

## Decision

**Nested Worker** を採用する。

chess Worker が `INIT_ENGINE` メッセージを受け取ったタイミングで、内部で Stockfish Worker を生成し UCI ハンドシェイクを行う。完了後に `ENGINE_READY` を返す。

```
React UI → chess Worker → Stockfish Worker
               ↑               ↑
           WASM (game)     UCI protocol
```

## Consequences

**メリット:**
- UI 層のメッセージ管理がシンプル。`INIT_ENGINE` / `ENGINE_READY` のみで抽象化される
- chess Worker がゲーム状態と AI エンジンを一体管理するため、着手生成と合法手検証が同レイヤーで完結する
- Stockfish のライフサイクル (terminate, 再初期化) を chess Worker が責任を持つため、UI 側に漏れない

**デメリット:**
- Worker-inside-Worker パターンのため、テスト時に `new Worker(...)` を `beforeEach` 内で `vi.stubGlobal` する必要がある (`vi.resetModules()` と組み合わせるため)
- Stockfish のエラーは chess Worker 経由で `ERROR` メッセージとしてのみ伝播する

## UCI ハンドシェイク

```
chess Worker → Stockfish: "uci"
chess Worker ← Stockfish: "uciok"
chess Worker → Stockfish: "isready"
chess Worker ← Stockfish: "readyok"
chess Worker → UI:        { type: "ENGINE_READY" }
```

タイムアウト 10 秒を設定し、応答がない場合は `ERROR` を返す。
