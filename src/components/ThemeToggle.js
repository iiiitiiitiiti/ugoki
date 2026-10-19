const STORAGE_KEY = 'ugoki:theme';
const root = document.documentElement;

function render(button) {
  button.querySelector('.m-theme-toggle__label').textContent =
    root.dataset.theme === 'dark' ? 'ライトにする' : 'ダークにする';
}

document.querySelectorAll('.m-theme-toggle').forEach((button) => {
  render(button);
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, root.dataset.theme);
    } catch (e) {
      // 保存できなくても、このページでは切り替える
    }
    render(button);
  });
});
