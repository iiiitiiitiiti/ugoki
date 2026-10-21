// 今の1枚はスクロール位置で決め、点の色と囲みの出入りは CSS の transition に任せる
// 点で送るときは押した点をすぐ今の1枚にし、途中の点を光らせない

// スクロールがこの時間止まったら、着いた1枚の時間を最初から数え直す
const SETTLE = 150;

// CSS の時間をミリ秒の数にする。公開用に縮めると 600ms が .6s に書き換わるため、単位を見て換算する
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

function initFadeDots(root) {
  const track = root.querySelector('.m-fade-dots__track');
  const dots = [...root.querySelectorAll('.m-fade-dots__dot')];
  const last = track.children.length - 1;
  const pause = root.querySelector('.m-fade-dots__pause');
  const interval = toMs(getComputedStyle(root).getPropertyValue('--interval'));
  let timer = null;
  let holding = false;
  let hovering = false;
  let settle = 0;
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
    timer?.cancel();
    timer = null;
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
      sync();
      waitForSettle();
    },
    { passive: true },
  );

  // 指で触れている間とホイール・キーで動かしている間は、送りも時間も止める
  function interrupt() {
    stop();
    sync();
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
  startTimer();
}

document.querySelectorAll('.m-fade-dots').forEach(initFadeDots);
