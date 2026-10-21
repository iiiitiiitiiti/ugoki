// 点の見た目は、スライドの横スクロールの量そのもので決める（指で引いた分だけ点も伸び縮みする）
// 1枚ごとの見た目を止めたアニメーションに並べておき、スクロールのたびに再生位置を合わせる
const LENGTH = 1000;
// 今の点が伸びる長さ（style.css の点の長さ24px と丸8px の差）
const GROW = 16;

function initStretchDots(root) {
  const track = root.querySelector('.m-stretch-dots__track');
  const dots = [...root.querySelectorAll('.m-stretch-dots__dot')];
  const last = track.children.length - 1;
  let current = 0;
  let move = null;

  // 今何枚目か（0〜last）。スライドの途中なら小数になる
  function position() {
    const max = track.scrollWidth - track.clientWidth;
    return max > 0 ? Math.min(Math.max(track.scrollLeft / max, 0), 1) * last : 0;
  }

  // frame(k) が k 枚目のときの見た目。その間はスクロールの量に比例して動く
  function timeline(element, frame, pseudoElement) {
    const keyframes = Array.from({ length: last + 1 }, (_, k) => ({ ...frame(k), offset: k / last }));
    const animation = element.animate(keyframes, { duration: LENGTH, fill: 'both', pseudoElement });
    animation.pause();
    return animation;
  }

  // 今の点は右側の切り抜きをなくして伸ばし、後ろの点はその分だけ右へずらす
  const animations = dots.flatMap((dot, i) => [
    timeline(dot, (k) => ({ transform: `translateX(${i > k ? GROW : 0}px)` })),
    timeline(
      dot,
      (k) => ({
        opacity: k === i ? 1 : 0.3,
        clipPath: `inset(0 ${k === i ? 0 : GROW}px 0 0 round 4px)`,
      }),
      '::before',
    ),
  ]);

  function sync() {
    const p = position();
    animations.forEach((animation) => {
      animation.currentTime = (p / last) * LENGTH;
    });
    const index = Math.round(p);
    if (index === current) return;
    dots[current].removeAttribute('aria-current');
    dots[index].setAttribute('aria-current', 'true');
    current = index;
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
      duration: parseFloat(style.getPropertyValue('--duration')),
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
    track.addEventListener(type, stop, { passive: true });
  }

  sync();
}

document.querySelectorAll('.m-stretch-dots').forEach(initStretchDots);
