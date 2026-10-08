# my-ai-api（Cloudflare Workers）

HTMLとは独立したAPIサーバーです。HTML側はこのWorkerのURLを入力して使います。

## 手順
1. `corpus.txt` を学習データに差し替える
2. `npm install`
3. `npm run train`（`src/model.json` が生成される）
4. `npx wrangler login`
5. `npm run deploy`（表示されたURLを控える）

## エンドポイント
- `GET  /api/v1/health`
- `POST /api/v1/generate` body: `{"prompt": "...", "length": 200, "temperature": 0.8}`
  レスポンス: `{"prompt": "...", "text": "..."}`

## 注意
- `model.json` が大きすぎるとデプロイできません。`ORDER=3 npm run train` などで小さくしてください。
- 公開する場合はCloudflareのレート制限の設定を検討してください。
