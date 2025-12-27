# 旅遊匯率 (TravelRate)

一個極致美學的即時匯率計算機，專為旅行者設計。

## 部署到 Cloudflare Pages

此專案已配置為使用 Vite 進行構建，可直接部署到 Cloudflare Pages。

### 步驟

1.  **推送到 GitHub**
    將此專案的所有檔案推送到您的 GitHub Repository。

2.  **設定 Cloudflare Pages**
    *   登入 Cloudflare Dashboard。
    *   進入 **Workers & Pages**。
    *   點擊 **Create Application** > **Connect to Git**。
    *   授權並選擇此 Repository。

3.  **構建設定 (Build Settings)**
    Cloudflare 通常會自動偵測，若沒有，請手動輸入：
    *   **Framework Preset**: `Vite`
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`

4.  **部署**
    點擊 **Save and Deploy** 即可完成！

## 本地開發

```bash
npm install
npm run dev
```
