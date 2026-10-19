// 全作品の JS を1本にまとめる。各作品はページ内に自分の部品が無ければ何もしない
import.meta.glob('../pieces/*/script.js', { eager: true });
