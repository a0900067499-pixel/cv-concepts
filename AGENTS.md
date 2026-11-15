# AGENTS.md — 「像素之後」專案規則

> 這份文件寫給**協助開發本專案的 AI**（Claude、Codex、Copilot 等）以及人類協作者。
> 開始任何修改之前，請完整讀過一次。如果使用者的要求和這份文件衝突，**先停下來向使用者說明衝突點**，不要自行決定。

---

## 1. 專案目的

「像素之後」是一個**電腦視覺基礎概念介紹網站**，讀者是剛接觸電腦視覺／深度學習的大學生。

- **一頁只講一個概念**（例如：卷積、池化、感受野）。
- 每一頁都使用**相同的五段結構**，讓讀者換頁時不需要重新適應版面。
- 目標是讓讀者「看完能用自己的話講出來」，而不是寫成教科書或論文。

成功的頁面標準：一個沒學過的人，只讀「一句話定義」和「直覺理解」兩段，就能大概知道這個概念在做什麼。

---

## 2. 技術限制（不可違反）

| 項目 | 規則 |
|---|---|
| 技術 | 純 HTML + CSS + 原生 JavaScript。**不使用**任何框架（React、Vue）、打包工具（Vite、Webpack）或靜態網站產生器。 |
| 部署 | GitHub Pages，從 `main` 分支根目錄直接部署，**沒有建置步驟**。 |
| 外部資源 | 只允許 Google Fonts。不得引用其他 CDN、不得熱連結外部圖片。 |
| 圖片 | 優先用 HTML 表格、CSS 或 `<canvas>` 畫圖。必須用圖片時放在 `assets/img/<slug>/`，使用 `.svg` 或 `.webp`，檔案 < 200 KB。 |
| 樣式 | 全站只有一支 `assets/css/style.css`。**禁止**在頁面內寫 `<style>` 或 `style="..."`（例外：首頁由 JS 產生的 `--cat` 變數）。 |
| 本機預覽 | `python3 -m http.server 8000`，然後開 `http://localhost:8000`。直接雙擊 HTML 會因為 `fetch` 失敗而看不到目錄。 |

---

## 3. 資料夾結構

```
cv-concepts/
├── index.html                  首頁：卡片目錄（內容全部由 JSON 產生，通常不用改）
├── concepts/                   ★ 每個概念一個 HTML 檔
│   ├── pixel.html
│   ├── convolution.html
│   └── ...
├── data/
│   └── concepts.json           ★ 全站唯一的「目錄資料」：標題、分類、順序、相關概念
├── assets/
│   ├── css/style.css           全站唯一樣式表
│   ├── js/site.js              共用腳本：導覽、卡片、目錄、相關概念、上下頁
│   ├── js/demos/<slug>.js      （選用）某一頁的互動示範
│   └── img/<slug>/             （選用）某一頁的圖片
├── templates/
│   └── concept-template.html   ★ 新概念頁的範本，一律從這裡複製
├── scripts/
│   └── check.py                規則檢查器，送出前必跑
├── AGENTS.md                   本文件
├── CLAUDE.md                   給 Claude Code 的入口（指向本文件）
└── README.md                   給人看的專案簡介
```

**分工原則：** 「這一頁要說什麼」寫在 `concepts/<slug>.html`；「這一頁在網站的哪裡、跟誰相關」寫在 `data/concepts.json`。導覽、目錄、上下頁、相關連結**全部自動產生，絕對不要手寫在 HTML 裡**。

---

## 4. 命名規則

- **slug**：英文小寫、單字用 `-` 連接（kebab-case），用該概念最通用的英文名稱。
  - ✅ `receptive-field`、`batch-normalization`、`iou`
  - ❌ `ReceptiveField`、`receptive_field`、`感受野`、`concept6`
- 檔名一定是 `concepts/<slug>.html`，且等於頁面 `<body data-slug="...">` 與 JSON 中的 `slug`。
- 互動腳本：`assets/js/demos/<slug>.js`；圖片資料夾：`assets/img/<slug>/`。
- slug 一旦上線**不要改名**（會讓外部連結失效）。真的要改，先問使用者。

---

## 5. `data/concepts.json` 欄位定義

每個概念是 `concepts` 陣列裡的一個物件：

| 欄位 | 型別 | 規則 |
|---|---|---|
| `slug` | string | 見命名規則，全站唯一 |
| `title` | string | 中文標題，2–8 個字，與頁面 `<h1>` 完全相同 |
| `en` | string | 英文名稱，Title Case |
| `category` | string | 必須是 `categories` 中已存在的 `id`（目前：`basics`、`operations`、`training`） |
| `order` | int | 全站閱讀順序，從 1 開始、不可重複；新增概念時接在最後面 |
| `level` | int | 1 = 入門、2 = 進階、3 = 深入 |
| `summary` | string | 首頁卡片用的一句話，**25–50 字**，以「。」結尾 |
| `related` | string[] | 1–4 個**已存在**的 slug，不能包含自己 |
| `updated` | string | 最後修改日期，`YYYY-MM-DD` |

新增分類要先問使用者。分類顏色需與現有三色明顯不同，且在白底上對比足夠。

---

## 6. 概念頁的固定結構

所有概念頁都從 `templates/concept-template.html` 複製。`<article>` 內必須依序包含以下 section，**id 與 `<h2>` 文字不可更改、不可調換順序**：

| 順序 | id | `<h2>` 標題 | 內容要求 |
|---|---|---|---|
| 1 | `tldr` | 一句話定義 | 放在 `<p class="tldr">` 中，1–2 句、60 字內，不使用未解釋的術語 |
| 2 | `intuition` | 直覺理解 | 一個 `.analogy` 生活比喻 + 一段把比喻接回電腦視覺的說明 |
| 3 | `how` | 怎麼運作 | 原理說明；有公式用 `.formula`；**一段 10–20 行的 NumPy 最小範例**（`<pre><code>`） |
| 4 | `example` | 動手看看 | 二擇一：用 `.matrix` 表格的**靜態數字例子**，或 `.demo` **互動示範** |
| 5 | `pitfalls` | 常見誤解 | `.pitfalls` 清單，**至少 2 條**，每條包含 `.wrong`（錯誤說法）和 `.right`（正確說法＋理由） |
| — | `related` | 相關概念 | 只留空的 `#related-list`，由 JS 自動填入 |

`how` 與 `example` 底下可以自由加 `<h3>` 小標題，但不可新增其他 `<section id>`。

---

## 7. 寫作風格

- **語言**：繁體中文、台灣用語（「影像」不是「圖像」、「程式」不是「程序」、「資料」不是「數據」）。
- **標點**：中文用全形標點（，。：「」），中英文之間加半形空格。
- **術語**：第一次出現時附英文原文，格式為 `卷積（<span class="term">convolution</span>）`；之後只用中文。
- **語氣**：像學長姐講解，用「你」稱呼讀者；短句優先，一段不超過 4 句。
- **比喻**：要來自日常生活（印章、放大鏡、拼圖），不要用另一個專業術語來解釋術語。
- **數字例子**：用小矩陣（3×3 到 6×6），數字讓讀者可以心算驗證。
- **程式碼**：Python + NumPy，變數名稱用英文，註解用中文，放在 `<span class="c"># ...</span>` 裡。程式碼必須能實際執行並得到頁面上寫的結果。
- **不要**：寫歷史沿革、列一長串論文、使用 emoji、使用「眾所周知」「顯而易見」。

---

## 8. 可用元件（`style.css` 已定義）

| class | 用途 |
|---|---|
| `.tldr` | 一句話定義的大字引言框 |
| `.analogy` | 灰底比喻框，會自動顯示「比喻」小標 |
| `.formula` | 置中的公式框（等寬字） |
| `.term` | 英文術語的灰色等寬字 |
| `.matrix` / `td.hl` | 數字矩陣表格／高亮某格 |
| `.matrix.pixel-view` / `td.on` | 把矩陣畫成黑白像素（`td.on` 為白），用來和數值矩陣對照 |
| `.matrix-row` + `.op` | 多個矩陣橫排，中間放運算符號（`∗`、`→`、`=`） |
| `.figure-caption` | 圖表下方說明文字 |
| `.demo` / `.demo-controls` / `.demo-stage` / `.demo-label` | 互動示範的外框／按鈕列／畫布區／畫布標籤 |
| `.pitfalls` + `.wrong` / `.right` | 常見誤解卡片 |

需要新元件時：先在 `style.css` 末端新增（附註解），再把它補進這張表。不要為了單一頁面的小差異新增元件。

---

## 9. 互動示範規則（選用）

- 一頁最多一個互動示範，寫在 `assets/js/demos/<slug>.js`，在頁面最後以 `<script>` 載入（在 `site.js` 之後）。
- 用原生 JS + `<canvas>` 或 DOM，不引用函式庫。
- 必須有「不操作也看得懂」的預設狀態；按鈕使用 `.demo-controls button` 並以 `aria-pressed` 表示選取狀態。
- 顏色從 CSS 變數讀取（`getComputedStyle(document.body).getPropertyValue("--cat")`），不要寫死。
- 參考實作：`assets/js/demos/convolution.js`。

---

## 10. 新增一個概念的標準流程（SOP）

當使用者說「幫我新增『○○』這個概念」時，依序執行：

1. **確認不重複**：檢查 `data/concepts.json` 是否已有相同或高度重疊的概念。有的話先問使用者要合併還是另開。
2. **決定 slug、category、level**；category 不明確時問使用者。
3. **在 `data/concepts.json` 末端新增一筆**，`order` = 目前最大值 + 1，`updated` = 今天日期。
4. **複製範本**：`cp templates/concept-template.html concepts/<slug>.html`。
5. **依第 6、7 節填寫五段內容**，刪除所有 `{{ }}` 與 TODO 註解。
6. **雙向連結**：把新 slug 加進 1–2 個相關舊概念的 `related`，並更新那些概念的 `updated`。
7. **（選用）互動示範**：依第 9 節新增 `assets/js/demos/<slug>.js`。
8. **跑檢查**：`python3 scripts/check.py`，必須顯示全部通過。
9. **本機預覽**：確認首頁出現新卡片、上下頁與目錄正常、手機寬度（< 520px）不跑版。
10. **commit**：訊息格式 `新增概念：<中文標題>（<slug>）`。

修改既有概念時：只改需要改的段落、更新 `updated`、跑 `check.py`，commit 訊息為 `修改概念：<中文標題> — <改了什麼>`。

---

## 11. AI 必須遵守的規則

**一定要做**
- 動手前先讀 `data/concepts.json` 和至少一個既有概念頁，模仿它的寫法與長度。
- 所有數字例子與程式碼自己算過／跑過，確認結果正確。
- 完成後執行 `python3 scripts/check.py`，並回報結果。

**不要做**
- 不要修改 `site.js`、`style.css`、`index.html` 的既有行為，除非使用者明確要求。
- 不要手寫導覽、目錄、上下頁或相關連結。
- 不要一次重寫整頁來修一個小問題。
- 不要刪除概念頁或修改 slug。
- 不要在沒有被要求的情況下新增分類、新增必要段落或改變五段結構。

**遇到不確定時**：停下來問，並提出你建議的選項。

---

## 12. 待新增概念清單（Backlog）

使用者沒有指定主題時，可以從這裡依序挑選：

| slug | 標題 | category | level |
|---|---|---|---|
| `activation-function` | 激活函數 | operations | 1 |
| `batch-normalization` | 批次正規化 | training | 2 |
| `overfitting` | 過擬合 | training | 1 |
| `transfer-learning` | 遷移學習 | training | 2 |
| `iou` | 交併比 | basics | 2 |
| `anomaly-detection` | 異常偵測 | basics | 3 |

完成一項後把它從這張表刪掉。
