let timer = 0;

export function showToast(message) {
  const toast = document.querySelector('.m-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2000);
}
