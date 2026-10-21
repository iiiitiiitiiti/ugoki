// 線は2層。見終えた分はスライドの横スクロールの量で満ち（指で引いた分だけ動く）、今の1枚の線は時間で満ちる
// スクロールに合わせる側は、1枚ごとの見た目を止めたアニメーションに並べ、スクロールのたびに再生位置を合わせる
const LENGTH = 1000;
// スクロールがこの時間止まったら、今の1枚の時間を最初から数え直す
const SETTLE = 150;

// CSS の時間をミリ秒の数にする。公開用に縮めると 600ms が .6s に書き換わるため、単位を見て換算する
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

function initProgressBars(root) {
  const track = root.querySelector('.m-progress-bars__track');
  const bars = [...root.querySelectorAll('.m-progress-bars__bar')];
  const pause = root.querySelector('.m-progress-bars__pause');
  const last = track.children.length - 1;
  const interval = toMs(getComputedStyle(root).getPropertyValue('--interval'));
  let current = 0;
  let move = null;
  let timer = null;
  let holding = false;
  let settle = 0;

  // 今何枚目か（0〜last）。スライドの途中なら小数になる
  function position() {
    const max = track.scrollWidth - track.clientWidth;
    return max > 0 ? Math.min(Math.max(track.scrollLeft / max, 0), 1) * last : 0;
  }

  // k 枚目のときは、それより前の線が満ちている
  const animations = bars.map((bar, i) => {
    const keyframes = Array.from({ length: last + 1 }, (_, k) => ({
      transform: `scaleX(${i < k ? 1 : 0})`,
      offset: k / last,
    }));
    const animation = bar.animate(keyframes, { duration: LENGTH, fill: 'both', pseudoElement: '::before' });
    animation.pause();
    return animation;
  });

  function sync() {
    const p = position();
    animations.forEach((animation) => {
      animation.currentTime = (p / last) * LENGTH;
    });
    const index = Math.round(p);
    if (index === current) return;
    bars[current].removeAttribute('aria-current');
    bars[index].setAttribute('aria-current', 'true');
    current = index;
  }

  const stopped = () => pause.getAttribute('aria-pressed') === 'true';

  function cancelTimer() {
    timer?.cancel();
    timer = null;
  }

  function startTimer() {
    cancelTimer();
    timer = bars[current].animate(
      { transform: ['scaleX(0)', 'scaleX(1)'] },
      { duration: interval, fill: 'forwards', pseudoElement: '::after' },
    );
    if (stopped()) timer.pause();
    timer.onfinish = () => goTo(current === last ? 0 : current + 1, true);
  }

  function holdTimer() {
    if (timer?.playState === 'running') timer.pause();
  }

  // 指が離れてスクロールも止まったら、着いた1枚の時間を数え始める
  function waitForSettle() {
    clearTimeout(settle);
    settle = setTimeout(() => {
      if (!holding && !move) startTimer();
    }, SETTLE);
  }

  function stop() {
    if (!move) return;
    cancelAnimationFrame(move.frame);
    move.clock.cancel();
    move = null;
    root.classList.remove('is-moving');
  }

  function goTo(index, auto = false) {
    stop();
    // 時間で次へ進むときは、満ちた線を着くまで残す（見終えた分の線に切れ目なく引き継ぐ）
    if (!auto || index < current) cancelTimer();
    const from = track.scrollLeft;
    const to = (index / last) * (track.scrollWidth - track.clientWidth);
    if (Math.abs(to - from) < 1) {
      startTimer();
      return;
    }
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

  bars.forEach((bar, index) => {
    bar.addEventListener('click', () => goTo(index));
  });

  pause.addEventListener('click', () => {
    const next = !stopped();
    pause.setAttribute('aria-pressed', String(next));
    pause.setAttribute('aria-label', next ? '自動送りを始める' : '自動送りを止める');
    if (next) holdTimer();
    else if (!timer) startTimer();
    else if (timer.playState === 'paused') timer.play();
  });

  track.addEventListener(
    'scroll',
    () => {
      sync();
      waitForSettle();
    },
    { passive: true },
  );

  // 指で触れている間とホイール・キーで動かしている間は、時間を止めて送りも止める
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

  sync();
  startTimer();
}

document.querySelectorAll('.m-progress-bars').forEach(initProgressBars);
