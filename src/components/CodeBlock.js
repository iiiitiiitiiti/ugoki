import { showToast } from './Toast.js';

// クリップボードの許可が無い環境（埋め込みのブラウザなど）では、選択してコピーする古い方法に切り替える
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  }
}

document.querySelectorAll('.m-code').forEach((block) => {
  const tabs = [...block.querySelectorAll('.m-code__tab')];
  const panels = [...block.querySelectorAll('.m-code__panel')];
  const copyButton = block.querySelector('.m-code__copy');

  function select(index, focus) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    copyButton.textContent = `${tabs[index].textContent.trim()} をコピー`;
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, false));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[
        event.key
      ];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });

  copyButton.addEventListener('click', async () => {
    const panel = panels.find((p) => !p.hidden);
    const ok = await copyText(panel.querySelector('pre').textContent);
    showToast(ok ? 'コピーしました' : 'コピーできませんでした');
    // 選択の後始末でフォーカスが外れるので、押したボタンに戻す
    copyButton.focus();
  });
});
