# CLAUDE.md

本專案的完整規則寫在 `AGENTS.md`，所有 AI 工具共用同一份規則，避免兩份文件內容不一致。

@AGENTS.md

## 給 Claude Code 的補充

- 新增或修改概念後，一定要執行 `python3 scripts/check.py`，並把輸出貼給使用者。
- 預覽網站：`python3 -m http.server 8000`。
- 規則有變更時，只改 `AGENTS.md`，不要把規則複製到這份檔案。
