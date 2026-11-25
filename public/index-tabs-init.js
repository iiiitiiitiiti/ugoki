// 一覧を描く前に、開くタブと位置を決める。Astro が束ねたスクリプトは描画後に動くので、
// 一瞬「動くパーツ」が見えたり、詳細ページから戻る枠の遷移が先頭の位置で始まったりする。
// そこで public に置き、パネルのすぐ後ろで同期読み込みする
(function () {
  var target = null;
  try {
    target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  } catch (e) {
    // 壊れた # は無いものとして扱う
  }
  var panel = target ? target.closest(".p-index__panel") : null;
  var group = panel ? panel.id.replace("panel-", "") : new URL(location.href).searchParams.get("tab");
  if (group && document.getElementById("panel-" + group)) {
    document.querySelectorAll(".p-index__tab").forEach(function (tab) {
      var selected = tab.dataset.group === group;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      var tabPanel = document.getElementById(tab.getAttribute("aria-controls"));
      if (selected) tabPanel.removeAttribute("hidden");
      else tabPanel.setAttribute("hidden", "until-found");
    });
    document.querySelectorAll(".p-index__toc").forEach(function (toc) {
      toc.hidden = toc.dataset.group !== group;
    });
  }
  // 戻る・進む・再読み込みでは、ブラウザが元の位置へ戻すのに任せる
  var navigation = performance.getEntriesByType("navigation")[0];
  var restored = navigation && (navigation.type === "back_forward" || navigation.type === "reload");
  if (panel && !restored) target.scrollIntoView();
})();
