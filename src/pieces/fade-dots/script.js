// 今の1枚はスクロール位置で決め、点の色と囲みの出入りは CSS の transition に任せる
// 点で送るときは押した点をすぐ今の1枚にし、途中の点を光らせない

// CSS の時間をミリ秒の数にする。公開用に縮めると 600ms が .6s に書き換わるため、単位を見て換算する
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

function initFadeDots(root) {
  const track = root.querySelector('.m-fade-dots__track');
  const dots = [...root.querySelectorAll('.m-fade-dots__dot')];
  const last = track.children.length - 1;
  let current = 0;
  let move = null;

  // 今何枚目か（0〜last）。スライドの途中なら小数になる
  function position() {
    const max = track.scrollWidth - track.clientWidth;
    return max > 0 ? Math.min(Math.max(track.scrollLeft / max, 0), 1) * last : 0;
  }

  function setCurrent(index) {
    if (index === current) return;
    dots[current].removeAttribute('aria-current');
    dots[index].setAttribute('aria-current', 'true');
    current = index;
  }

  function sync() {
    if (!move) setCurrent(Math.round(position()));
  }

  function stop() {
    if (!move) return;
    cancelAnimationFrame(move.frame);
    move.clock.cancel();
    move = null;
    root.classList.remove('is-moving');
  }

  function goTo(index) {
    stop();
    const from = track.scrollLeft;
    const to = (index / last) * (track.scrollWidth - track.clientWidth);
    if (Math.abs(to - from) < 1) return;
    setCurrent(index);
    const style = getComputedStyle(root);
    // 緩急の計算はブラウザに任せる。対象のないアニメーションを走らせ、その進み具合を読む
    const effect = new KeyframeEffect(null, null, {
      duration: toMs(style.getPropertyValue('--duration')),
      easing: style.getPropertyValue('--ease').trim(),
      fill: 'forwards',
    });
    const clock = new Animation(effect);
    const step = () => {
      track.scrollLeft = from + (to - from) * (effect.getComputedTiming().progress ?? 0);
      if (clock.playState === 'finished') {
        stop();
        return;
      }
      move.frame = requestAnimationFrame(step);
    };
    root.classList.add('is-moving');
    clock.play();
    move = { clock, frame: requestAnimationFrame(step) };
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goTo(index));
  });

  track.addEventListener('scroll', sync, { passive: true });
  // 送っている途中で指やホイールが触れたら、そちらに任せる
  for (const type of ['pointerdown', 'wheel', 'keydown']) {
    track.addEventListener(
      type,
      () => {
        stop();
        sync();
      },
      { passive: true },
    );
  }
}

document.querySelectorAll('.m-fade-dots').forEach(initFadeDots);
