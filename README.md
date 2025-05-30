# React Road お題チャレンジ　- イベント掲載アプリ -

Reactの実践型学習プラットフォーム [React Road](https://react-road.b13o.com/) のお題 [イベント掲載アプリ](https://react-road.b13o.com/challenges/event-listing-app)に挑戦させていただいた学習プロジェクトです。<br />
<br />
課題の実装の他、個人的な学習目的で私が行った変更や追加機能が含まれています。<br />

> [!NOTE]
> このリポジトリは、個人的な学習およびデモンストレーションの目的のみに使用されます。<br />
> This repository is for personal learning and demonstration purposes only.

## お題の内容
### 概要
connpass のようなイベントの掲載・申し込みができるアプリ<br />
React Router によるクライアントサイドルーティングを実践し、SPAの実装を学ぶ。
### 必須機能
1. **イベント一覧ページ**： サイトアクセス時に、イベント一覧を表示する。
2. **イベント詳細ページ**： イベント詳細情報を表示する。
3. **イベント申し込みページ**： イベントに申し込むためのメールフォームを表示する。
4. **申し込み完了ページ**： 申し込み完了メッセージを表示する。

### 追加した機能
- [x] React Router v6 => v7 にアップデート
- [x] 参加者が満員の場合、参加できないようにする
- [x] イベントと参加者情報をデータベースに保存（GETのみ実装）[#1](https://github.com/oumelab/demo-react-event-calendar/issues/1)
- [x] フロントエンドとバックエンドで型定義を共有
- [x] ユーザー認証機能の実装 [#3](https://github.com/oumelab/demo-react-event-calendar/issues/3)

### 今後の実装予定
- [ ] イベント情報管理のCRUD機能の実装 [#4](https://github.com/oumelab/demo-react-event-calendar/issues/4)
- [ ] イベント申し込み機能の実装 [#5](https://github.com/oumelab/demo-react-event-calendar/issues/5)
- [ ] イベント参加者管理機能の実装 [#6](https://github.com/oumelab/demo-react-event-calendar/issues/6)
- [ ] UI/UXの最適化とリファクタリング [#7](https://github.com/oumelab/demo-react-event-calendar/issues/7)

### 使用技術
- フロントエンド: Vite, React, React Router, Tailwind CSS, TanStack Query
- バックエンド: Cloudflare Pages Functions
- データベース: Turso (Local: SQLite)
- 認証： Better Auth
- デプロイ: Cloudflare Pages

### デモ
[View Demo site](https://demo-react-event-calendar.pages.dev/)
<br />

<a href="https://demo-react-event-calendar.pages.dev/" target="_blank">
  <picture>
    <source srcset="./public/screenshot.webp" type="image/webp" />
    <img src="./public/screenshot.png" alt="screen shot image" width="580" />
  </picture>
</a>

