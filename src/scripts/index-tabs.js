// 一覧の「動くパーツ／動かないパーツ」のタブと、追従バーの分類リンク
// 隠すパネルは hidden="until-found" にする。ページ内検索で見つかると開ける
// 読み込み時にどのタブを開くかは public/index-tabs-init.js が描画前に決める
const tablist = document.querySelector('.p-index__tabs');

if (tablist) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const tocs = tabs.map((tab) => document.querySelector(`.p-index__toc[data-group="${tab.dataset.group}"]`));
  const selectedIndex = () => tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');

  function select(index, { focus = false, record = false, animate = false } = {}) {
    const from = selectedIndex();
    // 下線が伸びる向きを、進む向きに合わせる
    tablist.dataset.dir = index < from ? 'back' : 'forward';
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panels[i].removeAttribute('hidden');
      else panels[i].setAttribute('hidden', 'until-found');
      tocs[i].hidden = !selected;
    });
    if (animate && index !== from) {
      // 押して切り替えたときだけ下から現す。読み込み時や戻ったときは、ページ間の遷移とぶつかるので動かさない
      const panel = panels[index];
      // 一覧の途中で切り替えたら、切り替えた先の頭から見せる
      if (panel.getBoundingClientRect().top < tablist.closest('.p-index__bar').getBoundingClientRect().bottom) {
        panel.scrollIntoView();
      }
      panel.classList.add('is-entering');
      panel.addEventListener('animationend', () => panel.classList.remove('is-entering'), { once: true });
    }
    if (focus) tabs[index].focus();
    if (record) {
      // 詳細ページから戻ったときに同じタブで開くよう、URL に残す（履歴は増やさない）
      const url = new URL(location.href);
      if (index === 0) url.searchParams.delete('tab');
      else url.searchParams.set('tab', tabs[index].dataset.group);
      url.hash = '';
      history.replaceState(history.state, '', url);
    }
    updateCurrent();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, { record: true, animate: true }));
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
    select(next, { focus: true, record: true, animate: true });
  });

  // ページ内検索やリンクで隠れたパネルの中が見つかったら、そのタブに切り替える
  panels.forEach((panel, i) => {
    panel.addEventListener('beforematch', () => select(i, { record: true }));
  });

  // 見出しやカードへのリンクが隠れたタブの中を指していたら、そのタブを開いてそこへ移る
  function openHash() {
    let target = null;
    try {
      target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    } catch (e) {
      // 壊れた # は無いものとして扱う
    }
    const index = target ? panels.findIndex((panel) => panel.contains(target)) : -1;
    if (index === -1) return;
    if (index !== selectedIndex()) {
      select(index);
      target.scrollIntoView();
    }
  }

  window.addEventListener('hashchange', openHash);

  // 今いる分類のリンクに印を付ける。バーのすぐ下まで来た見出しのうち、最後のものを今の分類にする
  const links = tocs.map((toc) => [...toc.querySelectorAll('.p-index__toc-link')]);
  const headings = links.map((group) => group.map((link) => document.getElementById(link.hash.slice(1))));
  let locked = false;
  let lockTimer = 0;

  function setCurrent(group, current) {
    links[group].forEach((link, i) => {
      if (i === current) {
        if (link.getAttribute('aria-current') === 'true') return;
        link.setAttribute('aria-current', 'true');
        // 横に並んだリンクが画面からはみ出す幅では、今の分類が見える位置へ寄せる
        const list = link.closest('.p-index__toc-list');
        list.scrollTo({ left: link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2, behavior: 'smooth' });
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateCurrent() {
    if (locked) return;
    const group = selectedIndex();
    const line = tablist.closest('.p-index__bar').getBoundingClientRect().bottom + innerHeight * 0.25;
    let current = 0;
    headings[group].forEach((heading, i) => {
      if (heading.getBoundingClientRect().top <= line) current = i;
    });
    // 最後の分類が短いと見出しが線まで上がらないので、末尾まで来たら最後の分類にする
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = headings[group].length - 1;
    setCurrent(group, current);
  }

  let frame = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateCurrent();
      });
    },
    { passive: true },
  );
  window.addEventListener('resize', updateCurrent);

  function unlock() {
    clearTimeout(lockTimer);
    locked = false;
    updateCurrent();
  }

  // 分類リンクは見出しまでなめらかに移る。移る間は通り過ぎる分類を光らせない
  links.forEach((group, g) => {
    group.forEach((link, i) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        setCurrent(g, i);
        locked = true;
        clearTimeout(lockTimer);
        lockTimer = setTimeout(unlock, 1200);
        window.addEventListener('scrollend', unlock, { once: true });
        headings[g][i].scrollIntoView({ behavior: 'smooth' });
        // 次の Tab がこの分類の中から始まるよう、フォーカスの起点を見出しへ移す
        headings[g][i].focus({ preventScroll: true });
        history.replaceState(history.state, '', link.hash);
      });
    });
  });

  openHash();
  updateCurrent();
}
