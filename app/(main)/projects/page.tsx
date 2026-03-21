import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderKanban, Plus } from 'lucide-react'
import type { ProjectStatus } from '@/types'

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: '計画中', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  active: { label: '進行中', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  completed: { label: '完了', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  archived: { label: 'アーカイブ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
}

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const hasProjects = (projects ?? []).length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">プロジェクト</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            アイデアを実行に変えるプロジェクトを管理
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-3 hover:bg-primary/80 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          新規プロジェクト
        </Link>
      </div>

      {hasProjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects ?? []).map((project) => {
            const statusInfo = STATUS_LABELS[(project.status as ProjectStatus) ?? 'planning']
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm leading-snug line-clamp-2">
                    {project.title}
                  </h3>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}
                {project.goal && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium">目標:</span> {project.goal}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${project.progress_percent}%` }}
                      />
                    </div>
                    <span>{project.progress_percent}%</span>
                  </div>
                  {project.deadline && (
                    <span>期限: {project.deadline}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">まだプロジェクトがありません</p>
          <Link href="/projects/new" className="text-xs underline mt-1 inline-block">
            最初のプロジェクトを作る
          </Link>
        </div>
      )}
    </div>
  )
}
