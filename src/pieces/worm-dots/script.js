// 帯の見た目は、スライドの横スクロールの量そのもので決める（指で引いた分だけ帯も伸び縮みする）
// 見た目を止めたアニメーションに並べておき、スクロールのたびに再生位置を合わせる
const LENGTH = 1000;

// スクロールがこの時間止まったら、着いた1枚の時間を最初から数え直す
const SETTLE = 150;

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
  const pause = root.querySelector('.m-worm-dots__pause');
  const interval = toMs(getComputedStyle(root).getPropertyValue('--interval'));
  let timer = null;
  let holding = false;
  let hovering = false;
  let settle = 0;
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
    timer?.cancel();
    timer = null;
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

  // 自動送り。次へ進むまでの時間は、止めて続きから数えられるアニメーションで数える
  const stopped = () => pause.getAttribute('aria-pressed') === 'true';

  function startTimer() {
    timer?.cancel();
    timer = new Animation(new KeyframeEffect(null, null, { duration: interval }));
    timer.onfinish = () => goTo(current === last ? 0 : current + 1);
    timer.play();
    if (stopped() || hovering) timer.pause();
  }

  function holdTimer() {
    if (timer?.playState === 'running') timer.pause();
  }

  function resumeTimer() {
    if (stopped() || hovering || holding) return;
    if (timer?.playState === 'paused') timer.play();
  }

  // 指が離れてスクロールも止まったら、着いた1枚の時間を数え始める
  function waitForSettle() {
    clearTimeout(settle);
    settle = setTimeout(() => {
      if (!holding && !move) startTimer();
    }, SETTLE);
  }

  pause.addEventListener('click', () => {
    const next = !stopped();
    pause.setAttribute('aria-pressed', String(next));
    pause.setAttribute('aria-label', next ? '自動送りを始める' : '自動送りを止める');
    if (next) holdTimer();
    else resumeTimer();
  });

  // カーソルを載せている間は止める。指で触れたときの pointerenter は数えない
  root.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    holdTimer();
  });
  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    resumeTimer();
  });

  track.addEventListener(
    'scroll',
    () => {
      if (animation) sync();
      waitForSettle();
    },
    { passive: true },
  );

  // 指で触れている間とホイール・キーで動かしている間は、送りも時間も止める
  function interrupt() {
    stop();
    holdTimer();
  }
  for (const type of ['pointerdown', 'touchstart']) {
    track.addEventListener(
      type,
      () => {
        holding = true;
        interrupt();
      },
      { passive: true },
    );
  }
  // 指でスクロールを始めると pointercancel が来て pointerup が来ないため、指は touchend で見る
  for (const type of ['pointerup', 'touchend', 'touchcancel']) {
    track.addEventListener(
      type,
      () => {
        holding = false;
        waitForSettle();
      },
      { passive: true },
    );
  }
  for (const type of ['wheel', 'keydown']) {
    track.addEventListener(
      type,
      () => {
        interrupt();
        waitForSettle();
      },
      { passive: true },
    );
  }

  // 点の間隔が変わったら帯の切り抜きを作り直す
  new ResizeObserver(build).observe(worm);
  startTimer();
}

document.querySelectorAll('.m-worm-dots').forEach(initWormDots);
