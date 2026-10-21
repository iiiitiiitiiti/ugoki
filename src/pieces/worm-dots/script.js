// 帯の見た目は、スライドの横スクロールの量そのもので決める（指で引いた分だけ帯も伸び縮みする）
// 見た目を止めたアニメーションに並べておき、スクロールのたびに再生位置を合わせる
const LENGTH = 1000;

// CSS の時間をミリ秒の数にする。公開用に縮めると 600ms が .6s に書き換わるため、単位を見て換算する
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

function initWormDots(root) {
  const track = root.querySelector('.m-worm-dots__track');
  const dots = [...root.querySelectorAll('.m-worm-dots__dot')];
  const worm = root.querySelector('.m-worm-dots__worm');
  const last = track.children.length - 1;
  let animation = null;
  let current = 0;
  let move = null;

  // 今何枚目か（0〜last）。スライドの途中なら小数になる
  function position() {
    const max = track.scrollWidth - track.clientWidth;
    return max > 0 ? Math.min(Math.max(track.scrollLeft / max, 0), 1) * last : 0;
  }

  // 帯を from 番目の点の左端から to 番目の点の右端まで見せる
  function build() {
    animation?.cancel();
    const size = worm.offsetHeight;
    const step = dots[1].offsetLeft - dots[0].offsetLeft;
    const width = worm.offsetWidth;
    const clip = (from, to) => `inset(0 ${width - to * step - size}px 0 ${from * step}px round ${size / 2}px)`;
    // 1枚分の半分で先頭の端が次の点へ届き、残りの半分で後ろの端が追いつく
    const keyframes = [];
    for (let k = 0; k <= last; k++) {
      keyframes.push({ clipPath: clip(k, k), offset: k / last });
      if (k < last) keyframes.push({ clipPath: clip(k, k + 1), offset: (k + 0.5) / last });
    }
    animation = worm.animate(keyframes, { duration: LENGTH, fill: 'both' });
    animation.pause();
    sync();
  }

  function sync() {
    const p = position();
    animation.currentTime = (p / last) * LENGTH;
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

  track.addEventListener('scroll', () => animation && sync(), { passive: true });
  // 送っている途中で指やホイールが触れたら、そちらに任せる
  for (const type of ['pointerdown', 'wheel', 'keydown']) {
    track.addEventListener(type, stop, { passive: true });
  }

  // 点の間隔が変わったら帯の切り抜きを作り直す
  new ResizeObserver(build).observe(worm);
}

document.querySelectorAll('.m-worm-dots').forEach(initWormDots);
