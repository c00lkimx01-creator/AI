# LeafAI API（Cloudflare Workers + Workers AI）

公開されているAIモデルを、Cloudflare Workers AI 経由で呼び出すAPIです。HTML（my-ai.html）とは独立しています。

## デプロイ手順
1. `npm install`
2. `npx wrangler login`
3. `npm run deploy`（表示されたURLを控える）

Workers AI はCloudflareダッシュボードで有効化が必要な場合があります。無料枠には1日の利用上限があります。

## モデルの変更
`src/worker.js` の `MODEL` を変えるだけで、別の公開モデルに切り替えられます。

## エンドポイント
- `GET  /api/v1/health`
- `POST /api/v1/generate` body: `{"prompt": "...", "length": 512, "temperature": 0.7}`
  レスポンス: `{"prompt": "...", "text": "..."}`
