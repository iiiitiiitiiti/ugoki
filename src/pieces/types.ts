export type Category = 'hover' | 'scroll' | 'transition' | 'toggle' | 'carousel' | 'loop' | 'static';

/** 一覧のタブ。動きのある分類と、動かない部品の分類を分ける */
export type Group = 'motion' | 'static';

export interface PieceMeta {
  title: string;
  category: Category;
  /** 一覧と詳細に出す1文。作り方の解説は書かない */
  summary: string;
  /** 同じ分類の中での並び順 */
  order: number;
}

export interface Piece extends PieceMeta {
  slug: string;
  markup: string;
  style: string;
  script?: string;
}
