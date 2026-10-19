// 名前は文書の中で重複できないため、切り替えの間だけ付けて終わったら外す
let count = 0;

function setNames(box, image, id) {
  box.style.viewTransitionName = `m-expand-${id}`;
  box.style.viewTransitionClass = 'm-expand';
  image.style.viewTransitionName = `m-expand-image-${id}`;
  image.style.viewTransitionClass = 'm-expand';
}

function clearNames(...elements) {
  for (const element of elements) {
    element.style.viewTransitionName = '';
    element.style.viewTransitionClass = '';
  }
}

function initExpand(root) {
  const id = count++;
  const card = root.querySelector('.m-expand__card');
  const detail = root.querySelector('.m-expand__detail');
  const close = root.querySelector('.m-expand__close');
  const cardImage = card.querySelector('.m-expand__image');
  const detailImage = detail.querySelector('.m-expand__image');

  function swap(from, fromImage, to, toImage, focusTarget) {
    const change = () => {
      from.hidden = true;
      to.hidden = false;
    };

    // 対応していないブラウザでは、動きを付けずに切り替えるだけにする
    if (!document.startViewTransition) {
      change();
      focusTarget.focus();
      return;
    }

    setNames(from, fromImage, id);
    const transition = document.startViewTransition(() => {
      clearNames(from, fromImage);
      change();
      setNames(to, toImage, id);
    });
    transition.finished.finally(() => {
      clearNames(to, toImage);
      focusTarget.focus();
    });
  }

  card.addEventListener('click', () => swap(card, cardImage, detail, detailImage, close));
  close.addEventListener('click', () => swap(detail, detailImage, card, cardImage, card));
}

document.querySelectorAll('.m-expand').forEach(initExpand);
