'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'idec_active_project'

export interface ActiveProject {
  id: string
  title: string
}

export function useActiveProject() {
  const [activeProject, setActiveProjectState] = useState<ActiveProject | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setActiveProjectState(JSON.parse(stored) as ActiveProject)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const setActiveProject = useCallback((project: ActiveProject | null) => {
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setActiveProjectState(project)
  }, [])

  return { activeProject, setActiveProject }
}
