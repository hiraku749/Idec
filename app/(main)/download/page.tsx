import Link from 'next/link'
import { Mic, Camera, Users, Zap, Download, Apple, Monitor, CheckCircle } from 'lucide-react'

const FEATURES = [
  {
    icon: Mic,
    title: '音声入力 (Fnキー)',
    description: 'どのアプリを使っていてもFnキー一発で録音開始。OpenAI Whisperが日本語を正確に文字起こしして自動保存。',
  },
  {
    icon: Camera,
    title: '画面OCR (⌘⇧O)',
    description: '画面の任意の領域を選択してテキストを抽出。スクリーンショットの文字をそのままノートに取り込めます。',
  },
  {
    icon: Users,
    title: '会議録音 (⌘⇧M)',
    description: '会議をリアルタイムで録音し、終了後にAIが自動で要約・決定事項・アクションアイテムを整理します。',
  },
  {
    icon: Zap,
    title: 'メニューバー常駐',
    description: 'Dockに表示せずメニューバーに常駐。作業を中断せず瞬時にノートをキャプチャできます。',
  },
]

const STEPS = [
  'DMGファイルをダウンロード',
  'DMGを開いてIdec.appをApplicationsフォルダにドラッグ',
  'アプリを起動 → メニューバーにアイコンが表示される',
  'システム設定 → プライバシーとセキュリティ → アクセシビリティでIdecを許可',
  'Next.jsサーバーを起動した状態でFnキーを押して動作確認',
]

export default function DownloadPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-12 animate-fade-in-up">
      {/* ヒーロー */}
      <div className="text-center space-y-4">
        <div className="text-5xl">⚡</div>
        <h1 className="text-3xl font-bold">Idec デスクトップ版</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Fnキー一発でいつでも・どこからでもノートにキャプチャ。
          Web版と完全に同期して、アイデアを逃しません。
        </p>

        {/* ダウンロードボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href="/downloads/Idec-latest.dmg"
            download="Idec.dmg"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold h-12 px-8 hover:bg-primary/80 transition-all text-sm"
          >
            <Apple className="w-4 h-4" />
            Mac版をダウンロード
            <Download className="w-4 h-4" />
          </a>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground">macOS 12 Monterey 以降 / Apple Silicon・Intel 対応</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-1">
            ⚠️ デスクトップ版は現在 <strong>macOS 専用</strong>です。Windows・Linux 版は準備中。
          </p>
        </div>
      </div>

      {/* Web版との比較 */}
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 text-sm">
          <div className="p-3 font-medium bg-muted/40">機能</div>
          <div className="p-3 font-medium text-center bg-muted/40 flex items-center justify-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" /> Web版
          </div>
          <div className="p-3 font-medium text-center bg-primary/5 flex items-center justify-center gap-1.5">
            <Apple className="w-3.5 h-3.5" /> デスクトップ版
          </div>
        </div>
        {[
          { name: 'ノート・AI機能', web: true, desktop: true },
          { name: '壁打ち / エージェント', web: true, desktop: true },
          { name: 'プロジェクト管理', web: true, desktop: true },
          { name: '音声入力 (Fnキー)', web: false, desktop: true },
          { name: '画面OCR', web: false, desktop: true },
          { name: '会議録音・AI要約', web: false, desktop: true },
          { name: 'メニューバー常駐', web: false, desktop: true },
        ].map((row) => (
          <div key={row.name} className="grid grid-cols-3 text-sm border-t">
            <div className="p-3 text-muted-foreground">{row.name}</div>
            <div className="p-3 text-center">
              {row.web
                ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                : <span className="text-muted-foreground/40 text-lg">—</span>}
            </div>
            <div className="p-3 text-center bg-primary/5">
              {row.desktop
                ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                : <span className="text-muted-foreground/40 text-lg">—</span>}
            </div>
          </div>
        ))}
      </div>

      {/* 機能詳細 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">デスクトップ版でできること</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="border rounded-xl p-4 bg-card space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="font-medium text-sm">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* インストール手順 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">インストール方法</h2>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-muted-foreground leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-center pb-4">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground underline">
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  )
}
