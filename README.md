# 像素之後｜電腦視覺基礎概念

一個「一頁一個概念」的電腦視覺入門網站。每一頁都用相同的五段結構：

**一句話定義 → 直覺理解 → 怎麼運作 → 動手看看 → 常見誤解**

🔗 網站：https://a0900067499-pixel.github.io/cv-concepts/

## 目前收錄

| # | 概念 | 分類 |
|---|---|---|
| 01 | 影像與像素 | 基礎 |
| 02 | 卷積（含互動示範） | 運算 |
| 03 | 池化 | 運算 |
| 04 | 感受野 | 運算 |
| 05 | 資料增強 | 訓練 |

## 這個專案怎麼擴充

專案的所有規則都寫在 [`AGENTS.md`](./AGENTS.md)（`CLAUDE.md` 會引用它）。新增概念時，AI 或人只需要：

1. 在 `data/concepts.json` 加一筆資料
2. 複製 `templates/concept-template.html` 到 `concepts/<slug>.html`，填入五段內容
3. 執行 `python3 scripts/check.py --run-code` 確認符合規則

首頁卡片、導覽、目錄、相關概念、上一頁／下一頁都會由 `assets/js/site.js` 依 JSON 自動產生。

## 本機預覽

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 技術

純 HTML / CSS / JavaScript，沒有框架與建置步驟，直接用 GitHub Pages 部署。
