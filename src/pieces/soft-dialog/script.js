let count = 0;

function initSoftDialog(root) {
  const page = root.querySelector('.m-soft-dialog__page');
  const opener = root.querySelector('.m-soft-dialog__open');
  const backdrop = root.querySelector('.m-soft-dialog__backdrop');
  const dialog = root.querySelector('.m-soft-dialog__window');
  const title = root.querySelector('.m-soft-dialog__title');
  const closer = root.querySelector('.m-soft-dialog__close');

  // 小窓の名前として見出しを読ませる id は、ここで付ける（同じページに複数置けるように）
  title.id = `m-soft-dialog-${count++}`;
  dialog.setAttribute('aria-labelledby', title.id);

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    dialog.inert = !open;
    // 開いている間は、後ろのページへキーボードで移れないようにする
    page.inert = open;
    // inert を外してからでないと、開いたボタンへフォーカスを戻せない
    if (open) dialog.focus();
    else opener.focus();
  }

  opener.addEventListener('click', () => setOpen(true));
  closer.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !root.classList.contains('is-open')) return;
    setOpen(false);
  });
}

document.querySelectorAll('.m-soft-dialog').forEach(initSoftDialog);
