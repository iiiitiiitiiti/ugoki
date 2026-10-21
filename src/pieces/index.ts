// 全作品を集める。デモに使うファイルと、詳細ページに見せるコードは同じファイルから読む
import type { Category, Group, Piece, PieceMeta } from './types';

// 一覧・詳細のどちらでも全作品の CSS を読み込む（どれも小さいので分けない）
import.meta.glob('./*/style.css', { eager: true });

const metas = import.meta.glob<PieceMeta>('./*/meta.ts', { import: 'default', eager: true });
const markups = import.meta.glob<string>('./*/markup.html', { query: '?raw', import: 'default', eager: true });
const styles = import.meta.glob<string>('./*/style.css', { query: '?raw', import: 'default', eager: true });
const scripts = import.meta.glob<string>('./*/script.js', { query: '?raw', import: 'default', eager: true });

export const groups: { id: Group; label: string }[] = [
  { id: 'motion', label: '動くパーツ' },
  { id: 'static', label: '動かないパーツ' },
];

export const categories: { id: Category; label: string; group: Group }[] = [
  { id: 'hover', label: 'ホバー', group: 'motion' },
  { id: 'scroll', label: 'スクロール', group: 'motion' },
  { id: 'transition', label: '画面切り替え', group: 'motion' },
  { id: 'toggle', label: '開閉', group: 'motion' },
  { id: 'carousel', label: 'カルーセル', group: 'motion' },
  { id: 'loop', label: 'ループ', group: 'motion' },
  { id: 'static', label: '動かない部品', group: 'static' },
];

export const categoryLabel = (id: Category) => categories.find((c) => c.id === id)?.label ?? id;

const categoryOrder = categories.map((c) => c.id);

export const pieces: Piece[] = Object.entries(metas)
  .map(([path, meta]) => {
    const dir = path.replace(/\/meta\.ts$/, '');
    const markup = markups[`${dir}/markup.html`];
    const style = styles[`${dir}/style.css`];
    // 欠けた作品を黙って飛ばさず、build を止める
    if (markup === undefined || style === undefined) {
      throw new Error(`${dir}: markup.html と style.css は必須です`);
    }
    return {
      ...meta,
      slug: dir.replace(/^\.\//, ''),
      markup,
      style,
      script: scripts[`${dir}/script.js`],
    };
  })
  .sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.order - b.order,
  );
