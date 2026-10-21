let count = 0;

// CSS の時間をミリ秒の数にする。公開用に縮めると 600ms が .6s に書き換わるため、単位を見て換算する
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

function initTabs(root) {
  const id = count++;
  const list = root.querySelector('.m-tabs__list');
  const tabs = [...root.querySelectorAll('.m-tabs__tab')];
  const panels = [...root.querySelectorAll('.m-tabs__panel')];
  const indicator = root.querySelector('.m-tabs__indicator');
  let current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));
  let running = [];

  // タブと中身の対応を読み上げに伝えるための id は、ここで付ける（同じページに複数置けるように）
  tabs.forEach((tab, index) => {
    tab.id = `m-tabs-${id}-tab-${index}`;
    panels[index].id = `m-tabs-${id}-panel-${index}`;
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('aria-labelledby', tab.id);
  });

  function placeIndicator() {
    const tab = tabs[current];
    indicator.style.setProperty('--x', `${tab.offsetLeft}px`);
    indicator.style.setProperty('--w', tab.offsetWidth);
  }

  function select(index) {
    if (index === current) return;
    const direction = index > current ? 1 : -1;
    const style = getComputedStyle(root);
    const options = {
      duration: toMs(style.getPropertyValue('--duration')),
      easing: style.getPropertyValue('--ease').trim(),
    };
    const distance = parseFloat(style.getPropertyValue('--distance'));
    const oldPanel = panels[current];
    const newPanel = panels[index];

    running.forEach((animation) => animation.cancel());

    tabs[current].setAttribute('aria-selected', 'false');
    tabs[current].tabIndex = -1;
    tabs[index].setAttribute('aria-selected', 'true');
    tabs[index].tabIndex = 0;
    oldPanel.hidden = true;
    newPanel.hidden = false;
    current = index;
    placeIndicator();

    // 進む向きなら右から入って左へ抜け、戻る向きならその逆にする
    running = [
      oldPanel.animate(
        [
          { visibility: 'visible', opacity: 1, transform: 'none' },
          { visibility: 'visible', opacity: 0, transform: `translateX(${-direction * distance}px)` },
        ],
        options,
      ),
      newPanel.animate(
        [
          { opacity: 0, transform: `translateX(${direction * distance}px)` },
          { opacity: 1, transform: 'none' },
        ],
        options,
      ),
    ];
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
  });

  list.addEventListener('keydown', (event) => {
    const last = tabs.length - 1;
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    tabs[next].focus();
  });

  // 文字の読み込みや枠の大きさの変化でタブの幅が変わったら、線を合わせ直す
  new ResizeObserver(placeIndicator).observe(list);
  placeIndicator();
  requestAnimationFrame(() => root.classList.add('is-ready'));
}

document.querySelectorAll('.m-tabs').forEach(initTabs);
