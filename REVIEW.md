# Review Guidelines

impl-loop の 3 種レビュアーが使用するレビュー観点。

## Quality Review

担当: `quality-reviewer`

### Must Check
- 未使用のコード・import がないか
- 重複ロジックがないか（DRY）
- 関数・モジュールの責務が単一か
- 変数名・関数名が意図を表しているか
- ネストが深すぎないか（3段以上は要リファクタ）
- エラーハンドリングが適切か（握りつぶしていないか）

### Performance
- 不要な re-render がないか（React）
- WASM-JS 間の呼び出し回数が最小か
- 大きなデータのコピーが発生していないか

### Test Quality
- テストが実装の意図を表しているか
- エッジケースがカバーされているか
- テスト名が失敗時に原因を特定できるか

## UX Review

担当: `ux-reviewer`

### Interaction
- 操作に対するフィードバックが即座にあるか
- ドラッグ&ドロップが自然に動作するか
- 不正な操作時にユーザーに伝わるフィードバックがあるか
- undo/redo が直感的か

### Visual
- 盤面と駒の視認性が十分か
- 選択中の駒・合法手のハイライトが明確か
- レスポンシブ対応（モバイルでも操作可能か）
- コンピュータ思考中のローディング表示があるか

### Accessibility
- キーボード操作が可能か
- スクリーンリーダーで盤面状態が伝わるか
- コントラスト比が WCAG AA 以上か

## Architecture Review

担当: `architecture-reviewer`

### Contract Compliance
- bolt の実装が issue に記載された contract に従っているか
- WASM 公開 API が contract と一致しているか
- Worker メッセージ型が定義通りか

### Layer Separation
- UI が局面ロジックを持っていないか
- WASM の状態が唯一の正として機能しているか
- Worker 通信が適切に抽象化されているか

### Consistency
- 既存コードのパターンに従っているか
- 新しいパターンを導入する場合、ADR が書かれているか
- ファイル構成が規約に従っているか

## Review Process

1. coder が TDD で実装完了後、3 種レビュアーが **並列** でレビュー
2. 各レビュアーは自分の観点のみ指摘（越境しない）
3. 指摘は issue コメントまたは PR コメントに記載
4. coder が修正後、指摘したレビュアーのみ再レビュー
5. 全レビュアー approve で PR マージ可能
