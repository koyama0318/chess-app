# CI/CD WASM + React Hello World デプロイ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rust/WASM + React の最小構成を Cloudflare Pages に Wrangler CLI + GitHub Actions でデプロイし、本番と同じ技術スタックが CI/CD で通ることを検証する

**Architecture:** Rust の WASM クレート(`wasm/`)が `greet()` 関数をエクスポート。React(Vite) がそれを import して画面に表示する。GitHub Actions で wasm-pack build → vite build → wrangler pages deploy の順に実行。

**Tech Stack:** Rust, wasm-pack, React, Vite, bun, Wrangler CLI, GitHub Actions, Cloudflare Pages

---

## File Structure

```
chess-app/
  wasm/
    Cargo.toml            # Rust WASM クレート (作成)
    src/
      lib.rs              # greet() を export (作成)
  src/
    index.html            # Vite エントリ HTML (作成)
    main.tsx              # React エントリポイント (作成)
    App.tsx               # WASM を呼び出して表示 (作成)
  package.json            # bun + Vite + React 設定 (作成)
  vite.config.ts          # Vite 設定 (作成)
  tsconfig.json           # TypeScript 設定 (作成)
  .github/
    workflows/
      deploy.yml          # GitHub Actions ワークフロー (作成)
  .gitignore              # dist/, target/ 等を追加 (変更)
```

---

## Task 0: Cloudflare 側の準備 (手動)

このタスクはユーザがブラウザと Cloudflare ダッシュボードで行う手順。

- [ ] **Step 1: Cloudflare Account ID を取得**
  1. https://dash.cloudflare.com にログイン
  2. 左サイドバーで「Workers & Pages」をクリック
  3. 右サイドバーに **Account ID** が表示される
  4. この値をメモしておく

- [ ] **Step 2: API Token を作成**
  1. https://dash.cloudflare.com/profile/api-tokens にアクセス
  2. 「Create Token」をクリック
  3. 「Custom token」の「Get started」を選択
  4. 設定:
     - Token name: `chess-app-deploy`
     - Permissions:
       - Account / Cloudflare Pages / Edit
     - Account Resources: 自分のアカウントを選択
  5. 「Continue to summary」→「Create Token」
  6. 表示されたトークンをコピーして安全に保管（二度と表示されない）

- [ ] **Step 3: Cloudflare Pages プロジェクトを作成**

  ```bash
  bunx wrangler pages project create chess-app
  ```

  ※ 初回は `wrangler login` でブラウザ認証が必要。

- [ ] **Step 4: GitHub リポジトリに Secrets を設定**
  1. https://github.com/koyama0318/chess-app/settings/secrets/actions にアクセス
  2. 「New repository secret」で以下を追加:
     - Name: `CLOUDFLARE_ACCOUNT_ID` / Value: Step 1 の Account ID
     - Name: `CLOUDFLARE_API_TOKEN` / Value: Step 2 の API Token

---

## Task 1: Rust WASM クレート作成

**Files:**

- Create: `wasm/Cargo.toml`
- Create: `wasm/src/lib.rs`

- [ ] **Step 1: wasm/Cargo.toml を作成**

  ```toml
  [package]
  name = "chess-wasm"
  version = "0.1.0"
  edition = "2021"

  [lib]
  crate-type = ["cdylib"]

  [dependencies]
  wasm-bindgen = "0.2"
  ```

- [ ] **Step 2: wasm/src/lib.rs を作成**

  ```rust
  use wasm_bindgen::prelude::*;

  #[wasm_bindgen]
  pub fn greet() -> String {
      "hello world from wasm".to_string()
  }
  ```

- [ ] **Step 3: ローカルで wasm-pack build を確認**

  Run: `cd wasm && wasm-pack build --target web --out-dir ../wasm-pkg`
  Expected: `wasm-pkg/` に `.wasm` と JS グルーコードが生成される

- [ ] **Step 4: Commit**

  ```bash
  git add wasm/
  git commit -m "feat: add rust wasm crate with greet()"
  ```

---

## Task 2: React + Vite プロジェクト初期化

**Files:**

- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Modify: `.gitignore`

- [ ] **Step 1: package.json を作成**

  ```json
  {
    "name": "chess-app",
    "version": "0.0.1",
    "private": true,
    "type": "module",
    "scripts": {
      "build:wasm": "cd wasm && wasm-pack build --target web --out-dir ../wasm-pkg",
      "build:web": "vite build",
      "build": "bun run build:wasm && bun run build:web",
      "dev": "bun run build:wasm && vite"
    },
    "dependencies": {
      "react": "^19",
      "react-dom": "^19"
    },
    "devDependencies": {
      "@types/react": "^19",
      "@types/react-dom": "^19",
      "@vitejs/plugin-react": "^4",
      "typescript": "^5",
      "vite": "^6",
      "vite-plugin-wasm": "^3",
      "wrangler": "^4"
    }
  }
  ```

- [ ] **Step 2: vite.config.ts を作成**

  ```typescript
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import wasm from "vite-plugin-wasm";

  export default defineConfig({
    plugins: [react(), wasm()],
    build: {
      target: "esnext",
    },
  });
  ```

- [ ] **Step 3: tsconfig.json を作成**

  ```json
  {
    "compilerOptions": {
      "target": "ESNext",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "jsx": "react-jsx",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "outDir": "dist"
    },
    "include": ["src"]
  }
  ```

- [ ] **Step 4: .gitignore を更新**

  ```
  node_modules/
  dist/
  wasm-pkg/
  wasm/target/
  .wrangler/
  ```

- [ ] **Step 5: bun install を実行**

  Run: `bun install`
  Expected: `node_modules/` と `bun.lockb` が生成される

- [ ] **Step 6: Commit**

  ```bash
  git add package.json vite.config.ts tsconfig.json bun.lockb .gitignore
  git commit -m "chore: init vite + react + wasm project"
  ```

---

## Task 3: React Hello World ページ作成

**Files:**

- Create: `src/index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: src/index.html を作成**

  ```html
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Chess App</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/main.tsx"></script>
    </body>
  </html>
  ```

- [ ] **Step 2: src/main.tsx を作成**

  ```tsx
  import { createRoot } from "react-dom/client";
  import { App } from "./App";

  createRoot(document.getElementById("root")!).render(<App />);
  ```

- [ ] **Step 3: src/App.tsx を作成**

  ```tsx
  import { useEffect, useState } from "react";
  import init, { greet } from "../wasm-pkg/chess_wasm";

  export function App() {
    const [message, setMessage] = useState("loading wasm...");

    useEffect(() => {
      init().then(() => {
        setMessage(greet());
      });
    }, []);

    return <h1>{message}</h1>;
  }
  ```

- [ ] **Step 4: ローカルビルド確認**

  Run: `bun run build`
  Expected: `dist/` に `index.html` と JS/WASM アセットが生成される

- [ ] **Step 5: Commit**

  ```bash
  git add src/
  git commit -m "feat: add react app with wasm hello world"
  ```

---

## Task 4: GitHub Actions ワークフロー作成

**Files:**

- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: deploy.yml を作成**

  ```yaml
  name: Deploy to Cloudflare Pages

  on:
    push:
      branches:
        - main

  jobs:
    deploy:
      runs-on: ubuntu-latest
      permissions:
        contents: read
        deployments: write
      steps:
        - uses: actions/checkout@v4

        - uses: dtolnay/rust-toolchain@stable
          with:
            targets: wasm32-unknown-unknown

        - uses: jetli/wasm-pack-action@v0.4.0

        - uses: oven-sh/setup-bun@v2

        - run: bun install --frozen-lockfile

        - run: bun run build

        - uses: cloudflare/wrangler-action@v3
          with:
            apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
            accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
            command: pages deploy dist/ --project-name=chess-app
  ```

- [ ] **Step 2: Commit & Push**

  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "ci: add cloudflare pages deploy workflow with rust/wasm"
  git push origin main
  ```

- [ ] **Step 3: GitHub Actions の実行を確認**
  1. https://github.com/koyama0318/chess-app/actions にアクセス
  2. 「Deploy to Cloudflare Pages」ワークフローが成功していることを確認

- [ ] **Step 4: デプロイ結果を確認**
  1. Cloudflare ダッシュボードで「Workers & Pages」→「chess-app」を開く
  2. production デプロイが表示されていることを確認
  3. 表示された URL（`chess-app-xxx.pages.dev`）にアクセス
  4. 「hello world from wasm」と表示されていれば完了
