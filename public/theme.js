// 描画前にテーマを当てる。Astro が束ねたスクリプトは描画後に動き一瞬ライトが見えるので、public に置いて head で同期読み込みする
try {
  document.documentElement.dataset.theme = localStorage.getItem("ugoki:theme") === "dark" ? "dark" : "light";
} catch (e) {
  document.documentElement.dataset.theme = "light";
}
