// 数字の位置は、スライドの横スクロールの量そのもので決める（指で引いた分だけ数字も回る）
// 見た目を止めたアニメーションに並べておき、スクロールのたびに再生位置を合わせる
const LENGTH = 1000;

// スクロールがこの時間止まったら、着いた1枚の時間を最初から数え直す
const SETTLE = 150;

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
  const pause = root.querySelector('.m-count-roll__pause');
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

document.querySelectorAll('.m-count-roll').forEach(initCountRoll);
