# MySite 網站專案

這是一個以 Node.js + Express 架設的簡易購物平台，支援使用者註冊、登入、餘額加值、商品上架與購買功能。資料儲存使用 SQLite。

## 🏗 專案架構

```
mysite/
├── public/
│   ├── login.html         # 登入頁面
│   ├── register.html      # 註冊頁面
│   ├── main.html          # 主選單
│   ├── balance.html       # 加值 / 提款介面
│   ├── sell.html          # 商品上架介面
│   ├── view.html          # 使用者資金總覽
│   ├── buy.html           # 商品購買頁面
│   └── *.js               # 各頁面對應的 JS（若有）
├── index.js               # 伺服器主程式
├── db.sqlite3             # SQLite 資料庫
├── package.json
└── README.md
```

## ⚙ 安裝與執行

1. 安裝 Node.js（https://nodejs.org/）
2. 安裝相依套件：

   ```bash
   npm install
   ```

3. 啟動伺服器：

   ```bash
   node index.js
   ```

4. 在瀏覽器開啟：

   ```
   http://localhost:3000
   ```

## 📌 功能說明

- 使用者註冊 / 登入（使用 SHA256 加密密碼）
- 查詢餘額 / 加值 / 提款
- 商品上架（名稱、價格、數量、備註）
- 查看所有上架商品
- 商品購買（餘額充足才可購買）
- 使用者持有金額總覽
- 刪除自己上架的商品

## 🧱 使用技術

- 前端：HTML、JavaScript、Fetch API
- 後端：Node.js、Express
- 資料庫：SQLite（Node.js sqlite3 套件）
- 加密：crypto（SHA256 密碼雜湊）

## ✍ 作者

此專案為人機互動課程作業製作。

