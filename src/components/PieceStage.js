// デモの中のリンクは押しても移動しない（見本のコードには実際の href を残したいため、ここで止める）
document.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('.m-stage a[href]')) {
    event.preventDefault();
  }
});
