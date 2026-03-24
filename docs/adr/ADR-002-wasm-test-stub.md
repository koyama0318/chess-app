# ADR-002: WASM モジュールのテストスタブ戦略

## 状況

`chess.worker.ts` は WASM モジュール (`wasm-pkg/chess_wasm`) を動的 import する。
このモジュールは `wasm-pack build` によって生成されるため、`wasm-pkg/` ディレクトリは
ビルドなしの環境（ローカル開発、テスト単体実行）では存在しない。

`vi.mock` によるモックはランタイムで動作するが、Vite の `import-analysis` プラグインは
変換フェーズ（ランタイム前）にすべての import パスを解決しようとするため、
`wasm-pkg/chess_wasm` が存在しないと変換エラーが発生してテストが実行できない。

## 決定

**alias + vi.mock の二段構えを採用する。**

1. `vitest.config.ts` の `resolve.alias` に正規表現 `/.*\/wasm-pkg\/chess_wasm$/` を追加し、
   `src/__mocks__/chess_wasm.ts`（最小限のスタブ）に向ける。
   → Vite の変換フェーズが通るようになる。

2. WASM 実装を必要とする各テストファイルでは `vi.mock("../../../wasm-pkg/chess_wasm", factory)` を
   使い、テスト固有のモック実装で上書きする。
   → スタブの空クラスではなくテスト意図に沿った挙動を提供できる。

## 代替案と却下理由

- **alias のみ（vi.mock なし）**: スタブは空クラスのため、テストごとに必要な挙動を持たせられない。
- **vi.mock のみ**: Vite の変換フェーズを通過できず、`wasm-pkg` が存在しない環境でテスト不可。
- **wasm-pkg をコミット**: バイナリをリポジトリに含めるのは不適切。

## 結果

- `wasm-pack` ビルドなしでも `bun run test` が実行できる。
- 各テストファイルは `vi.mock` で自分のシナリオに合ったモックを定義する。
- `src/__mocks__/chess_wasm.ts` は Vite の解決用スタブであり、テストの挙動は定義しない。
  このファイルを変更しても既存テストは壊れない。
