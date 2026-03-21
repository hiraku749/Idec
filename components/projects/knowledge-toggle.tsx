'use client'

import { BookOpen, BookX } from 'lucide-react'
import { useActiveProject } from '@/lib/hooks/use-active-project'

interface Props {
  projectId: string
  projectTitle: string
}

export function ProjectKnowledgeToggle({ projectId, projectTitle }: Props) {
  const { activeProject, setActiveProject } = useActiveProject()
  const isActive = activeProject?.id === projectId

  function handleToggle() {
    if (isActive) {
      setActiveProject(null)
    } else {
      setActiveProject({ id: projectId, title: projectTitle })
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all border ${
        isActive
          ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
          : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
      }`}
    >
      {isActive ? (
        <>
          <BookOpen className="w-3.5 h-3.5" />
          ナレッジ使用中
        </>
      ) : (
        <>
          <BookX className="w-3.5 h-3.5" />
          ナレッジとして使う
        </>
      )}
    </button>
  )
}
