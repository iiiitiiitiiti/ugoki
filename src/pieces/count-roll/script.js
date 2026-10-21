// 数字の位置は、スライドの横スクロールの量そのもので決める（指で引いた分だけ数字も回る）
// 見た目を止めたアニメーションに並べておき、スクロールのたびに再生位置を合わせる
const LENGTH = 1000;

// CSS の時間をミリ秒の数にする。公開用に縮めると 600ms が .6s に書き換わるため、単位を見て換算する
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

function initCountRoll(root) {
  const track = root.querySelector('.m-count-roll__track');
  const digits = root.querySelector('.m-count-roll__digits');
  const prev = root.querySelector('.m-count-roll__prev');
  const next = root.querySelector('.m-count-roll__next');
  const last = track.children.length - 1;
  let current = 0;
  let move = null;

  // 今何枚目か（0〜last）。スライドの途中なら小数になる
  function position() {
    const max = track.scrollWidth - track.clientWidth;
    return max > 0 ? Math.min(Math.max(track.scrollLeft / max, 0), 1) * last : 0;
  }

  // 数字の列を1枚につき数字1つ分ずつ上げる。進むと次の数字が下から上がってくる
  const keyframes = Array.from({ length: last + 1 }, (_, k) => ({
    transform: `translateY(${(-k * 100) / (last + 1)}%)`,
    offset: k / last,
  }));
  const animation = digits.animate(keyframes, { duration: LENGTH, fill: 'both' });
  animation.pause();

  function sync() {
    const p = position();
    animation.currentTime = (p / last) * LENGTH;
    const index = Math.round(p);
    if (index === current) return;
    current = index;
    prev.setAttribute('aria-disabled', String(current === 0));
    next.setAttribute('aria-disabled', String(current === last));
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
    move = { clock, target: index, frame: requestAnimationFrame(step) };
  }

  // 送っている途中に続けて押したら、向かっている先からさらに1枚進める
  prev.addEventListener('click', () => {
    const from = move ? move.target : current;
    if (from > 0) goTo(from - 1);
  });
  next.addEventListener('click', () => {
    const from = move ? move.target : current;
    if (from < last) goTo(from + 1);
  });

  track.addEventListener('scroll', sync, { passive: true });
  // 送っている途中で指やホイールが触れたら、そちらに任せる
  for (const type of ['pointerdown', 'wheel', 'keydown']) {
    track.addEventListener(type, stop, { passive: true });
  }

  sync();
}

document.querySelectorAll('.m-count-roll').forEach(initCountRoll);
