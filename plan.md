# チェスアプリ仕様書

## 目的

本アプリは、ブラウザのみで高速に動作するチェス対戦環境を提供する。コンピュータ対戦、オフライン動作、中断からの完全再開を可能にし、静的サイトとして配信することでインフラコストを最小化する。

WASM を中核ロジックとし、UI と処理を明確に分離することで、高速性・整合性・保守性を同時に達成する。

---

## 技術スタック

### WASM ロジック

- 言語: Rust
- チェスエンジン: 既存 Stockfish WASM を流用（思考部分）
- WASM モジュールは局面管理、指し手適用、undo/redo、合法手生成、FEN 読み込み・出力、レンダリング用データ生成を担当する。

### UI

- ライブラリ: React
- UI は盤面描画とユーザ入力のみ担当し、ロジックや局面の整合性は保持しない。

### 実行環境

- 単一スレッド WASM
- WASM は Web Worker 上で動作し、UI の応答性を確保する。

### デプロイ

- Cloudflare Pages
- dist ディレクトリに HTML/JS/CSS/WASM/Worker を配置し配信する。

### ストレージ

- localStorage によるイベントソーシング
- move event を逐次保存し、一定手数ごとに snapshot(FEN) を保存する。

---

## アーキテクチャ

### 構成

```
React (UI)
   ↓
Web Worker
   ↓
WASM (Rust + Stockfish)
```

### WASM の責務

- FEN 読み込み
- move 適用
- undo / redo
- 合法手生成
- チェック / チェックメイト判定
- 盤面状態の保持（唯一の正）
- レンダリング用盤面データの出力
- Stockfish への局面入力と思考処理

### UI の責務

- WASM の API を呼び出す
- WASM から受け取った盤面状態を描画する
- ユーザ操作の検出
- move event を localStorage へ記録
- 起動時に localStorage からイベントを読み出し、WASM に順次適用して復元

---

## データ管理

### WASM 内部

- 現局面の完全な状態（唯一の正）
- FEN によるスナップショット出力

### JS 側

- move event の配列
- snapshot(FEN) の保持
- レンダリング用データのみ

### 復元フロー

1. localStorage から snapshot(FEN) を取得
2. WASM に FEN を適用して初期局面再構築
3. move event を順に WASM に適用
4. 最終局面が復元され UI が描画される

---

## Worker 通信仕様

### 主なメッセージ

- `init`（WASM 初期化）
- `apply_move`（ユーザの手を適用）
- `undo` / `redo`
- `compute_best_move`（Stockfish 思考要求）
- `get_render_state`（描画用 state を要求）

### 応答

- `render_state`（UI 用の盤面情報）
- `best_move`（コンピュータの指し手）

---

## デプロイ構成

- Cloudflare Pages
- immutable キャッシュ設定で WASM を高速配信
- 追加設定不要で単一スレッド WASM が動作

---

## 全体フロー

1. アプリ起動
2. localStorage にデータがあれば復元
3. WASM を Worker で初期化
4. UI 表示
5. ユーザが駒を操作
6. WASM が move を適用し、盤面状態を返す
7. UI が描画
8. computer 手番なら WASM 経由で Stockfish に探索要求
9. WASM が結果を返し UI が描画
10. 手番ごとにイベント保存

---

## 完成形の姿

- ブラウザだけで完全動作
- コンピュータ対戦が高速
- オフライン動作が可能
- 局面が破損せず復元可能
- UI とロジックが完全分離
- 静的サイトとして軽量デプロイ

これにより、最小コストで最大のパフォーマンスと安定性を得る構成が成立する。
