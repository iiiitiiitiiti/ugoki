let count = 0;

function initMenu(root) {
  const button = root.querySelector('.m-menu__button');
  const panel = root.querySelector('.m-menu__panel');

  // ボタンと開くメニューの対応を読み上げに伝えるための id は、ここで付ける（同じページに複数置けるように）
  panel.id = `m-menu-${count++}`;
  button.setAttribute('aria-controls', panel.id);

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    // 閉じている間は、見えないリンクにキーボードで移れないようにする
    panel.inert = !open;
  }

  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  // Esc で閉じたら、開いたボタンへ戻す
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    button.focus();
  });
}

document.querySelectorAll('.m-menu').forEach(initMenu);
