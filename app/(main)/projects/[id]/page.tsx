import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { NoteCard } from '@/components/notes/note-card'
import { FileText } from 'lucide-react'
import type { ProjectStatus } from '@/types'
import { ProjectActions } from './project-actions'
import { LinkNotes } from './link-notes'
import { ProjectKnowledgeToggle } from '@/components/projects/knowledge-toggle'

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: '計画中', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  active: { label: '進行中', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  completed: { label: '完了', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  archived: { label: 'アーカイブ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // プロジェクトに紐づくノート
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, tag, user_tags, is_pinned, updated_at')
    .eq('project_id', params.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(20)

  const statusInfo = STATUS_LABELS[(project.status as ProjectStatus) ?? 'planning']
  const hasNotes = (notes ?? []).length > 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div>
        <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground underline mb-3 inline-block">
          ← プロジェクト一覧
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ProjectKnowledgeToggle projectId={project.id} projectTitle={project.title} />
            <ProjectActions projectId={project.id} />
          </div>
        </div>
      </div>

      {/* メタデータ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {project.goal && (
          <div className="border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">目標</p>
            <p className="text-sm">{project.goal}</p>
          </div>
        )}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">進捗</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${project.progress_percent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{project.progress_percent}%</span>
          </div>
        </div>
        {project.deadline && (
          <div className="border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">期限</p>
            <p className="text-sm">{project.deadline}</p>
          </div>
        )}
      </div>

      {/* ノート一覧 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> 紐づくノート
          </h2>
          <div className="flex items-center gap-2">
            <LinkNotes projectId={project.id} />
            <Link
              href={`/notes/new?projectId=${project.id}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all"
            >
              + 新規ノート作成
            </Link>
          </div>
        </div>
        {hasNotes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(notes ?? []).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
            まだノートが紐づいていません
          </p>
        )}
      </section>
    </div>
  )
}
