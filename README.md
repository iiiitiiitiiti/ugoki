# うごき帳

Web 制作でよく使う部品（リンク・ボタン・カード・見出し・タブ・メニュー・カルーセル・ロゴの帯など）に付ける動きの見本帳です。枠の中で触って試し、作品名から開いた先で HTML・CSS・JS をそのままコピーできます。

- 公開 URL: https://iiiitiiitiiti.github.io/ugoki/
- コピーしたコードは、このサイトのほかの CSS・JS に頼らず単体で動きます
- 速さと緩急は、各作の CSS 先頭の `--duration` と `--ease` で変えられます

## 作品

| 分類 | 作品 | 仕組み |
|---|---|---|
| ホバー | 下線が伸びるリンク | 擬似要素の `scaleX`。伸びる向きと抜ける向きを `transform-origin` で切り替える |
| ホバー | 浮き上がるカード | カードの `translate`・影の透明度・画像の `scale` |
| ホバー | 矢印が抜けて戻るボタン | 重ねた2本の矢印の `translate`。`transition-delay` で抜けてから入る順にする |
| スクロール | 浮かび上がる見出しと本文 | `animation-timeline: view()` |
| スクロール | 幕が開くように出る画像 | 名前付きの `view-timeline` と `clip-path: inset()` |
| 画面切り替え | 広がって詳細になるカード | `document.startViewTransition` |
| 画面切り替え | 下線が滑るタブ | 下線の `transform` と、向きに合わせた左右のスライド（Web Animations） |
| 開閉 | ×に変わるメニューボタン | 線の `translate` と `rotate` を時間差で動かす。メニューは `clip-path: inset()` で上から開く |
| カルーセル | 囲みが移るドット | 線の丸の `translateX` と、点の色の `opacity` |
| カルーセル | 囲みが消えて現れるドット | 点の色と囲みをまとめた擬似要素の `opacity`（`transition`） |
| カルーセル | 伸びるドット | 点の `clip-path: inset()` と、後ろの点の `translateX` |
| カルーセル | 伸び縮みして移るドット | 帯の `clip-path: inset()`。先頭の端が先に動き、後ろの端が追いつく |
| カルーセル | 時間で満ちるバー | 線の `scaleX`。見終えた分はスクロール量、今の1枚は時間で満ちる |
| カルーセル | 数字が回る番号 | 数字の列の `translateY` |
| ループ | 流れ続けるロゴの帯 | 同じ並びを2つ続けた帯を `translate: -50%` まで繰り返す。乗せている間とボタンで `animation-play-state` を止める |

## 開発（Mac / Windows 共通）

Node.js 22.22 以上が必要です。

```sh
git clone https://github.com/iiiitiiitiiti/ugoki.git
cd ugoki
npm ci
npm run dev          # http://localhost:4321/ugoki/
```

| コマンド | 内容 |
|---|---|
| `npm run check` | 型チェック（astro check） |
| `npm run build` | 本番ビルド（`dist/`） |
| `npm run preview` | ビルド結果を開く |

`main` へ push すると、GitHub Actions が型チェックとビルドを通してから GitHub Pages へ公開します。

## 作品を足す

`src/pieces/<slug>/` にフォルダを作り、次のファイルを置きます。一覧と詳細ページには自動で並びます。

| ファイル | 必須 | 中身 |
|---|---|---|
| `markup.html` | 必須 | デモの HTML。id は使わず class だけにする（一覧と詳細で同じページに並ぶため） |
| `style.css` | 必須 | その作だけで完結する CSS。class は `m-` で始める |
| `script.js` | 任意 | JS が要る作だけ。ページ内の該当要素をすべて初期化する |
| `meta.ts` | 必須 | 作品名・分類（`hover` / `scroll` / `transition` / `toggle` / `carousel` / `loop`）・説明・分類内の順番 |

必須ファイルが欠けると build が止まります。詳細ページに出るコードは、デモで動いているファイルそのものです。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `src/pieces/index.ts` | 全作品のファイルを集め、分類と順番で並べる |
| `src/components/PieceStage.*` | デモを置く枠。スクロールの作では枠そのものをスクロール領域にする |
| `src/components/CodeBlock.*` | HTML・CSS・JS のタブとコピー |
| `src/scripts/pieces.js` | 全作品の `script.js` を1本にまとめて読み込む |
| `public/theme.js` | 描画前にテーマを当て、ダークの再読み込みでライトが一瞬見えるのを防ぐ |

設計の全体は [docs/DESIGN.md](docs/DESIGN.md)、判断の記録は [docs/decisions/](docs/decisions/) にあります。
