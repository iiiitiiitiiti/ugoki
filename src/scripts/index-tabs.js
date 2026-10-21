// 一覧の「動くパーツ／動かないパーツ」のタブ
// 隠すパネルは hidden="until-found" にする。ページ内検索で見つかると開ける
const tablist = document.querySelector('.p-index__tabs');

if (tablist) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

  function select(index, { focus = false, record = false } = {}) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panels[i].removeAttribute('hidden');
      else panels[i].setAttribute('hidden', 'until-found');
    });
    if (focus) tabs[index].focus();
    if (record) {
      // 詳細ページから戻ったときに同じタブで開くよう、URL に残す（履歴は増やさない）
      const url = new URL(location.href);
      if (index === 0) url.searchParams.delete('tab');
      else url.searchParams.set('tab', tabs[index].dataset.group);
      history.replaceState(history.state, '', url);
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, { record: true }));
  });

  tablist.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    const last = tabs.length - 1;
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, { focus: true, record: true });
  });

  // ページ内検索やリンクで隠れたパネルの中が見つかったら、そのタブに切り替える
  panels.forEach((panel, i) => {
    panel.addEventListener('beforematch', () => select(i, { record: true }));
  });

  // 見出しへのリンクが隠れたタブの中を指していたら、そのタブを開いて見出しへ移る
  function openHash() {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const index = target ? panels.findIndex((panel) => panel.contains(target)) : -1;
    if (index === -1) return false;
    if (tabs[index].getAttribute('aria-selected') !== 'true') {
      select(index, { record: true });
      target.scrollIntoView();
    }
    return true;
  }

  window.addEventListener('hashchange', openHash);

  // 見出しへのリンクで来ていなければ、URL に残したタブで開く
  if (!openHash()) {
    const fromParam = tabs.findIndex((tab) => tab.dataset.group === new URL(location.href).searchParams.get('tab'));
    if (fromParam > 0) select(fromParam);
  }
}
