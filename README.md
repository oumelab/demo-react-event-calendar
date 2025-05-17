# Reactハンズオン！ 「SPA編」の学習リポジトリ

Reactの実践型学習プラットフォーム [React Road](https://react-road.b13o.com/) のチャレンジお題 [イベント掲載アプリ](https://react-road.b13o.com/challenges/event-listing-app)に挑戦させていただいた学習プロジェクトです。<br />
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
- [x] イベントと参加者情報をデータベースに保存（GETのみ実装）
- [ ] フロントエンドとバックエンドで型定義を共有
- [ ] ユーザー認証機能の実装
- [ ] イベント申し込みのCRUD機能の実装

### 使用技術
- フロントエンド: Vite, React, React Router, Tailwind CSS, TanStack Query
- バックエンド: Cloudflare Pages Functions
- データベース: Turso
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

