// =================================================
// システムテンプレート定義
// ノート作成時に利用可能なプリセットテンプレート
// =================================================

import type { TiptapContent } from '@/types'

export interface SystemTemplate {
  id: string
  title: string
  description: string
  category: string
  content: TiptapContent
}

const h = (level: number, text: string) => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})

const p = (text: string = '') => ({
  type: 'paragraph',
  content: text ? [{ type: 'text', text }] : [],
})

const bullet = (items: string[]) => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [p(item)],
  })),
})

const hr = () => ({ type: 'horizontalRule' })

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'business-model-canvas',
    title: 'ビジネスモデルキャンバス',
    description: 'ビジネスモデルの9要素を整理するテンプレート',
    category: 'business',
    content: {
      type: 'doc',
      content: [
        h(1, 'ビジネスモデルキャンバス'),
        h(2, '顧客セグメント'),
        p('ターゲットとなる顧客は誰か？'),
        h(2, '価値提案'),
        p('顧客にどんな価値を提供するか？'),
        h(2, 'チャネル'),
        p('どのように顧客にリーチするか？'),
        h(2, '顧客との関係'),
        p('どのような関係を構築するか？'),
        h(2, '収益の流れ'),
        p('どのように収益を得るか？'),
        h(2, 'リソース'),
        p('必要な経営資源は？'),
        h(2, '主要活動'),
        p('価値を提供するための主な活動は？'),
        h(2, 'パートナー'),
        p('主要なパートナー・サプライヤーは？'),
        h(2, 'コスト構造'),
        p('主なコスト項目は？'),
      ],
    },
  },
  {
    id: 'swot-analysis',
    title: 'SWOT分析',
    description: '強み・弱み・機会・脅威を整理するテンプレート',
    category: 'analysis',
    content: {
      type: 'doc',
      content: [
        h(1, 'SWOT分析'),
        h(2, 'Strengths（強み）'),
        bullet(['強み 1', '強み 2', '強み 3']),
        h(2, 'Weaknesses（弱み）'),
        bullet(['弱み 1', '弱み 2', '弱み 3']),
        h(2, 'Opportunities（機会）'),
        bullet(['機会 1', '機会 2', '機会 3']),
        h(2, 'Threats（脅威）'),
        bullet(['脅威 1', '脅威 2', '脅威 3']),
      ],
    },
  },
  {
    id: 'user-story-map',
    title: 'ユーザーストーリーマップ',
    description: 'ユーザー視点で機能を整理するテンプレート',
    category: 'product',
    content: {
      type: 'doc',
      content: [
        h(1, 'ユーザーストーリーマップ'),
        h(2, 'ペルソナ'),
        p('対象ユーザーの特徴・ニーズ'),
        h(2, 'ユーザーの目標'),
        p('ユーザーが達成したいこと'),
        hr(),
        h(2, 'アクティビティ 1'),
        h(3, 'ステップ 1'),
        p('ユーザーが行うアクション'),
        h(3, 'ステップ 2'),
        p('次のアクション'),
        hr(),
        h(2, 'アクティビティ 2'),
        h(3, 'ステップ 1'),
        p('ユーザーが行うアクション'),
      ],
    },
  },
  {
    id: 'kpt-retrospective',
    title: '振り返り（KPT）',
    description: 'Keep / Problem / Try で振り返りを行うテンプレート',
    category: 'team',
    content: {
      type: 'doc',
      content: [
        h(1, '振り返り（KPT）'),
        p('対象期間: '),
        hr(),
        h(2, 'Keep（続けたいこと）'),
        bullet(['良かったこと 1', '良かったこと 2']),
        h(2, 'Problem（問題点）'),
        bullet(['課題 1', '課題 2']),
        h(2, 'Try（次に試したいこと）'),
        bullet(['改善案 1', '改善案 2']),
      ],
    },
  },
  {
    id: 'meeting-memo',
    title: 'ミーティングメモ',
    description: '会議の記録用テンプレート',
    category: 'team',
    content: {
      type: 'doc',
      content: [
        h(1, 'ミーティングメモ'),
        p('日時: '),
        p('参加者: '),
        p('目的: '),
        hr(),
        h(2, 'アジェンダ'),
        bullet(['議題 1', '議題 2', '議題 3']),
        h(2, '議事内容'),
        p(''),
        h(2, '決定事項'),
        bullet(['決定 1']),
        h(2, 'アクションアイテム'),
        bullet(['担当者 — タスク内容（期限: ）']),
        h(2, '次回予定'),
        p(''),
      ],
    },
  },
  {
    id: 'brainstorm',
    title: 'ブレインストーミング',
    description: 'アイデア出しのためのテンプレート',
    category: 'ideation',
    content: {
      type: 'doc',
      content: [
        h(1, 'ブレインストーミング'),
        h(2, 'テーマ / 課題'),
        p(''),
        h(2, '制約条件'),
        bullet(['制約 1', '制約 2']),
        hr(),
        h(2, 'アイデア一覧'),
        bullet(['アイデア 1', 'アイデア 2', 'アイデア 3', 'アイデア 4', 'アイデア 5']),
        hr(),
        h(2, '評価・選定'),
        p('最も有望なアイデアとその理由'),
        h(2, '次のステップ'),
        p(''),
      ],
    },
  },
  {
    id: 'project-proposal',
    title: 'プロジェクト提案書',
    description: '新規プロジェクトの提案テンプレート',
    category: 'business',
    content: {
      type: 'doc',
      content: [
        h(1, 'プロジェクト提案書'),
        h(2, '概要'),
        p('プロジェクトの概要を1〜2文で'),
        h(2, '背景・課題'),
        p('なぜこのプロジェクトが必要か'),
        h(2, '目標'),
        bullet(['目標 1', '目標 2']),
        h(2, 'スコープ'),
        p('含むもの / 含まないもの'),
        h(2, 'スケジュール'),
        bullet(['フェーズ1: ', 'フェーズ2: ', 'フェーズ3: ']),
        h(2, 'リソース'),
        p('必要な人員・予算'),
        h(2, 'リスク'),
        bullet(['リスク 1', 'リスク 2']),
        h(2, '成功指標'),
        bullet(['KPI 1', 'KPI 2']),
      ],
    },
  },
  {
    id: 'daily-journal',
    title: 'デイリージャーナル',
    description: '毎日の振り返りと気づきを記録するテンプレート',
    category: 'personal',
    content: {
      type: 'doc',
      content: [
        h(1, 'デイリージャーナル'),
        p('日付: '),
        hr(),
        h(2, '今日やったこと'),
        bullet(['タスク 1', 'タスク 2']),
        h(2, '学んだこと / 気づき'),
        p(''),
        h(2, '感謝すること'),
        p(''),
        h(2, '明日やること'),
        bullet(['タスク 1', 'タスク 2']),
      ],
    },
  },
]
