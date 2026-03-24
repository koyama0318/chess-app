# ADR-001: shakmaty を chess logic ライブラリとして採用

## Status

Accepted

## Context

WASM クレートにチェスの合法手生成ロジックが必要になった。選択肢は:

1. **手書き実装** — 完全な制御が可能だが、キャスリング・アンパッサン・プロモーション等のエッジケースでバグを生みやすい。開発工数も大きい。
2. **shakmaty** — Rust 製の高品質チェスライブラリ。FEN パース、合法手生成、UCI 変換を提供。`no_std` 対応で WASM ターゲットに適合。活発にメンテナンスされている。
3. **chess (crate)** — 別の Rust チェスライブラリ。shakmaty より低レベルで、UCI 変換等の便利機能が少ない。

## Decision

shakmaty を採用する。

## Rationale

- FEN パース → Position → legal_moves → UCI 変換のパイプラインが API として揃っている
- Chess960 対応の `CastlingMode` が将来の拡張に備えられる
- wasm32 ターゲットでの動作実績がある
- テスト済みのルール実装により、エッジケースバグのリスクを排除できる

## Consequences

- shakmaty のバージョンアップに追従する必要がある
- WASM バイナリサイズが増加する（約 600KB gzip 後 83KB — 許容範囲）
- チェスルールの独自拡張（variant chess 等）が必要になった場合、shakmaty の対応範囲に制約される
