// 止めるボタン。流れそのものは CSS のアニメーションで、ここでは止める・再開するだけを切り替える
function initLogoLoop(root) {
  const pause = root.querySelector('.m-logo-loop__pause');

  pause.addEventListener('click', () => {
    const paused = pause.getAttribute('aria-pressed') !== 'true';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? '流れを再開する' : '流れを止める');
    root.classList.toggle('is-paused', paused);
  });
}

document.querySelectorAll('.m-logo-loop').forEach(initLogoLoop);
