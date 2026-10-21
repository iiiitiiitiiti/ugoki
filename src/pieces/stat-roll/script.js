// CSS の時間は ms と s のどちらで書かれても数値（ms）にそろえる
function toMs(value) {
  const time = value.trim();
  return time.endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000;
}

// HTML の数字（例: 1,200）から、桁ごとの回る帯を組み立てる。JS が動かなければ数字はそのまま見える
function buildReels(value) {
  const text = value.textContent.trim();
  const reels = [];

  value.textContent = '';
  for (const char of text) {
    if (!/\d/.test(char)) {
      const mark = document.createElement('span');
      mark.textContent = char;
      mark.setAttribute('aria-hidden', 'true');
      value.append(mark);
      continue;
    }
    const digit = document.createElement('span');
    digit.className = 'm-stat-roll__digit';
    digit.setAttribute('aria-hidden', 'true');
    const reel = document.createElement('span');
    reel.className = 'm-stat-roll__reel';
    // 0〜9 を2周並べ、1周回ってから目当ての数字で止まるようにする
    for (let i = 0; i < 20; i += 1) {
      const n = document.createElement('span');
      n.textContent = String(i % 10);
      reel.append(n);
    }
    digit.append(reel);
    value.append(digit);
    reels.push({ reel, target: Number(char) });
  }

  const sr = document.createElement('span');
  sr.className = 'm-stat-roll__sr';
  sr.textContent = text;
  value.append(sr);
  return reels;
}

function initStatRoll(root) {
  const style = getComputedStyle(root);
  const duration = toMs(style.getPropertyValue('--duration'));
  const stagger = toMs(style.getPropertyValue('--stagger'));
  const easing = style.getPropertyValue('--ease').trim();
  const reels = [...root.querySelectorAll('.m-stat-roll__value')].flatMap((value) =>
    buildReels(value).map((item, i) => ({ ...item, index: i })),
  );
  let animations = [];

  function play() {
    animations = reels.map(({ reel, target, index }) =>
      reel.animate(
        [{ translate: '0 0' }, { translate: `0 ${-(10 + target) * 5}%` }],
        { duration: duration + index * stagger, easing, fill: 'forwards' },
      ),
    );
  }

  // 枠から出きったら0に戻し、もう一度入ったときにまた回す
  function reset() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
  }

  // 枠の端にぴったり接した状態は isIntersecting が true のまま割合が0になる。出きったかは割合で見る
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= 0.6 && animations.length === 0) play();
        if (entry.intersectionRatio < 0.01) reset();
      });
    },
    { threshold: [0, 0.01, 0.6] },
  ).observe(root);
}

document.querySelectorAll('.m-stat-roll').forEach(initStatRoll);
