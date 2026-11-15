/* 卷積互動示範 — 對應 concepts/convolution.html
   這是互動示範的參考實作，新的 demo 請照這個結構寫：
   1. 準備資料  2. 定義選項  3. render()  4. 綁按鈕、畫預設狀態 */

(function () {
  const N = 16;      // 輸入邊長
  const SCALE = 12;  // 每個像素畫成幾 px

  // 1. 輸入影像：深色底上一個亮色方塊和一條斜線
  const img = Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => {
      if (x >= 3 && x <= 8 && y >= 3 && y <= 8) return 220;
      if (Math.abs(x - y) <= 0 && x >= 9) return 255;
      if (Math.abs((15 - x) - y) <= 0 && y >= 9) return 160;
      return 30;
    })
  );

  // 2. 可選的卷積核
  const kernels = [
    { name: "原圖", k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], abs: false },
    { name: "模糊", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)), abs: false },
    { name: "垂直邊緣", k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], abs: true },
    { name: "水平邊緣", k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], abs: true },
    { name: "銳化", k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], abs: false },
  ];

  const inCanvas = document.getElementById("conv-input");
  const outCanvas = document.getElementById("conv-output");
  const kernelTable = document.getElementById("conv-kernel");
  const buttons = document.getElementById("conv-buttons");
  if (!inCanvas) return;

  function draw(canvas, grid) {
    const ctx = canvas.getContext("2d");
    grid.forEach((row, y) => row.forEach((v, x) => {
      const g = Math.max(0, Math.min(255, Math.round(v)));
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }));
  }

  function convolve(grid, k, useAbs) {
    const out = [];
    for (let i = 0; i < N - 2; i++) {
      out.push([]);
      for (let j = 0; j < N - 2; j++) {
        let s = 0;
        for (let m = 0; m < 3; m++) for (let n = 0; n < 3; n++) s += grid[i + m][j + n] * k[m][n];
        out[i].push(useAbs ? Math.abs(s) / 4 : s);   // 邊緣核取絕對值並縮放，方便顯示
      }
    }
    return out;
  }

  const fmt = (v) => (Number.isInteger(v) ? String(v).replace("-", "−") : "1/9");

  // 3. 依目前選的核重畫
  function render(idx) {
    const { k, abs } = kernels[idx];
    kernelTable.innerHTML = k.map((r) => `<tr>${r.map((v) => `<td${v !== 0 ? ' class="hl"' : ""}>${fmt(v)}</td>`).join("")}</tr>`).join("");
    draw(outCanvas, convolve(img, k, abs));
    [...buttons.children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === idx)));
  }

  // 4. 建按鈕、畫預設狀態
  buttons.innerHTML = kernels.map((kn) => `<button type="button">${kn.name}</button>`).join("");
  [...buttons.children].forEach((b, i) => b.addEventListener("click", () => render(i)));
  draw(inCanvas, img);
  render(2);   // 預設顯示「垂直邊緣」，不操作也看得出效果
})();
