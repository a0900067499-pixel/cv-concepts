#!/usr/bin/env python3
"""
像素之後 — 規則檢查器
把 AGENTS.md 裡「可以被機器檢查」的規則全部檢查一遍。

用法：
    python3 scripts/check.py            # 檢查結構與命名
    python3 scripts/check.py --run-code # 另外執行每頁的 Python 範例程式（需要 numpy）

全部通過時結束碼為 0，否則為 1。只用 Python 標準函式庫。
"""
import html
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONCEPTS_DIR = ROOT / "concepts"
REQUIRED_SECTIONS = [
    ("tldr", "一句話定義"),
    ("intuition", "直覺理解"),
    ("how", "怎麼運作"),
    ("example", "動手看看"),
    ("pitfalls", "常見誤解"),
    ("related", "相關概念"),
]
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
FIELDS = {"slug": str, "title": str, "en": str, "category": str, "order": int,
          "level": int, "summary": str, "related": list, "updated": str}

errors, warnings = [], []
err = lambda where, msg: errors.append(f"✗ {where}：{msg}")
warn = lambda where, msg: warnings.append(f"! {where}：{msg}")


def check_json():
    data = json.loads((ROOT / "data" / "concepts.json").read_text(encoding="utf-8"))
    cat_ids = {c["id"] for c in data["categories"]}
    slugs = [c.get("slug") for c in data["concepts"]]
    orders = [c.get("order") for c in data["concepts"]]

    if len(slugs) != len(set(slugs)):
        err("concepts.json", "有重複的 slug")
    if len(orders) != len(set(orders)):
        err("concepts.json", "有重複的 order")
    if sorted(orders) != list(range(1, len(orders) + 1)):
        warn("concepts.json", f"order 應為 1..{len(orders)} 連續整數，目前是 {sorted(orders)}")

    for c in data["concepts"]:
        where = f"concepts.json[{c.get('slug', '?')}]"
        for f, t in FIELDS.items():
            if not isinstance(c.get(f), t):
                err(where, f"缺少欄位 `{f}` 或型別不是 {t.__name__}")
        if errors and errors[-1].startswith(f"✗ {where}"):
            continue
        if not SLUG_RE.match(c["slug"]):
            err(where, "slug 必須是小寫 kebab-case")
        if c["category"] not in cat_ids:
            err(where, f"category `{c['category']}` 不存在")
        if c["level"] not in (1, 2, 3):
            err(where, "level 必須是 1、2 或 3")
        if not 2 <= len(c["title"]) <= 8:
            err(where, f"title 應為 2–8 字（目前 {len(c['title'])} 字）")
        if not 25 <= len(c["summary"]) <= 50:
            err(where, f"summary 應為 25–50 字（目前 {len(c['summary'])} 字）")
        if not c["summary"].endswith("。"):
            err(where, "summary 必須以「。」結尾")
        if not 1 <= len(c["related"]) <= 4:
            err(where, "related 必須有 1–4 個")
        for r in c["related"]:
            if r == c["slug"]:
                err(where, "related 不能包含自己")
            elif r not in slugs:
                err(where, f"related 裡的 `{r}` 不存在")
        try:
            if date.fromisoformat(c["updated"]) > date.today():
                warn(where, "updated 是未來的日期")
        except ValueError:
            err(where, "updated 必須是 YYYY-MM-DD")
    return data


def check_page(c):
    path = CONCEPTS_DIR / f"{c['slug']}.html"
    where = f"concepts/{c['slug']}.html"
    if not path.exists():
        err(where, "檔案不存在")
        return None
    src = path.read_text(encoding="utf-8")

    m = re.search(r'<body[^>]*data-slug="([^"]+)"', src)
    if not m or m.group(1) != c["slug"]:
        err(where, "<body data-slug> 必須等於檔名")
    if 'data-page="concept"' not in src or 'data-root=".."' not in src:
        err(where, '<body> 需要 data-page="concept" 與 data-root=".."')

    h1 = re.search(r"<h1>(.*?)</h1>", src, re.S)
    if not h1 or html.unescape(h1.group(1).strip()) != c["title"]:
        err(where, f"<h1> 必須與 JSON title「{c['title']}」相同")
    title = re.search(r"<title>(.*?)</title>", src)
    if not title or not title.group(1).startswith(c["title"] + "｜"):
        err(where, "<title> 格式應為「標題｜像素之後」")
    desc = re.search(r'<meta name="description" content="([^"]*)"', src)
    if not desc or desc.group(1) != c["summary"]:
        err(where, "meta description 必須與 JSON summary 相同")

    # 必要 section 的順序與標題
    found = re.findall(r'<section id="([^"]+)">\s*<h2>(.*?)</h2>', src)
    expected = REQUIRED_SECTIONS
    if [f[0] for f in found] != [e[0] for e in expected]:
        err(where, f"section 順序應為 {[e[0] for e in expected]}，目前是 {[f[0] for f in found]}")
    for (sid, h2) in found:
        exp = dict(expected).get(sid)
        if exp and h2 != exp:
            err(where, f"section #{sid} 的標題應為「{exp}」")

    if '<p class="tldr">' not in src:
        err(where, "一句話定義必須放在 <p class=\"tldr\">")
    else:
        tldr = re.search(r'<p class="tldr">(.*?)</p>', src, re.S).group(1)
        if len(re.sub(r"<[^>]+>", "", tldr)) > 60:
            warn(where, "一句話定義超過 60 字")
    if 'class="analogy"' not in src:
        err(where, "直覺理解需要 .analogy 比喻框")
    if "<pre><code>" not in src:
        err(where, "怎麼運作需要一段 <pre><code> 範例程式")
    pit = re.search(r'<ul class="pitfalls">(.*?)</ul>', src, re.S)
    n_pit = len(re.findall(r'class="wrong"', pit.group(1))) if pit else 0
    if n_pit < 2:
        err(where, f"常見誤解至少 2 條（目前 {n_pit}）")
    if not re.search(r'<div class="related-list" id="related-list">\s*</div>', src):
        err(where, "相關概念必須留空的 #related-list，由 site.js 產生")

    # 禁止事項
    if "{{" in src or "TODO" in src:
        err(where, "還有範本佔位符 {{ }} 或 TODO 沒刪")
    if "<style" in src or re.search(r'\sstyle="', src):
        err(where, "禁止在頁面內寫 <style> 或 style=\"\"")
    for url in re.findall(r'(?:src|href)="(https?://[^"]+)"', src):
        if "fonts.googleapis.com" not in url and "fonts.gstatic.com" not in url:
            err(where, f"不允許的外部資源：{url}")
    demo = ROOT / "assets" / "js" / "demos" / f"{c['slug']}.js"
    uses_demo = f"demos/{c['slug']}.js" in src
    if uses_demo and not demo.exists():
        err(where, "載入了不存在的互動腳本")
    if demo.exists() and not uses_demo:
        warn(where, f"assets/js/demos/{c['slug']}.js 存在但頁面沒有載入")
    return src


def run_code(slug, src):
    blocks = re.findall(r"<pre><code>(.*?)</code></pre>", src, re.S)
    for i, b in enumerate(blocks, 1):
        code = html.unescape(re.sub(r"<[^>]+>", "", b))
        r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
        if r.returncode != 0:
            err(f"concepts/{slug}.html 程式碼 #{i}", r.stderr.strip().splitlines()[-1])


def main():
    run = "--run-code" in sys.argv
    data = check_json()
    slugs = {c["slug"] for c in data["concepts"]}
    for c in data["concepts"]:
        src = check_page(c)
        if src and run:
            run_code(c["slug"], src)
    for f in CONCEPTS_DIR.glob("*.html"):
        if f.stem not in slugs:
            err(f"concepts/{f.name}", "沒有登記在 concepts.json（孤兒頁面）")

    print(f"檢查 {len(data['concepts'])} 個概念" + ("（含執行範例程式）" if run else ""))
    for line in errors + warnings:
        print("  " + line)
    if errors:
        print(f"\n✗ {len(errors)} 個錯誤、{len(warnings)} 個警告")
        sys.exit(1)
    print(f"\n✓ 全部通過（{len(warnings)} 個警告）")


if __name__ == "__main__":
    main()
