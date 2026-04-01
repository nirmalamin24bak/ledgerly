'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LedgerProject } from '@/types'
import { setActiveProject } from '@/lib/actions/projects'
import { ChevronDown, Check, Plus, Trash2, Loader2, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProjectSwitcher({
  projects,
  activeProjectId,
}: {
  projects: LedgerProject[]
  activeProjectId?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find(p => p.id === activeProjectId)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setNewName('')
        setError('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSwitch(projectId: string) {
    if (projectId === activeProjectId) { setOpen(false); return }
    await setActiveProject(projectId)
    setOpen(false)
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error ?? 'Failed to create'); return }
      await setActiveProject(data.data.id)
      setCreating(false)
      setNewName('')
      setOpen(false)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e: React.MouseEvent, projectId: string, projectName: string) {
    e.stopPropagation()
    if (!confirm(`Delete project "${projectName}"? This cannot be undone.`)) return
    setDeletingId(projectId)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        alert(data.error ?? 'Failed to delete project')
        return
      }
      // If we deleted the active project, switch to the first remaining one
      if (projectId === activeProjectId) {
        const remaining = projects.filter(p => p.id !== projectId)
        if (remaining.length > 0) {
          await setActiveProject(remaining[0].id)
        }
      }
      setOpen(false)
      router.refresh()
    } catch {
      alert('Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 transition-colors text-left"
      >
        <FolderOpen className="w-3.5 h-3.5 text-blue-300/70 shrink-0" />
        <span className="text-[12px] font-medium text-blue-100 truncate flex-1">
          {activeProject?.name ?? 'Select project'}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-blue-300/60 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-blue-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Projects list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {projects.map(project => (
              <div
                key={project.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/8 cursor-pointer group"
                onClick={() => handleSwitch(project.id)}
              >
                <Check className={cn('w-3.5 h-3.5 shrink-0', project.id === activeProjectId ? 'text-blue-300' : 'text-transparent')} />
                <span className="text-[12px] text-blue-100 truncate flex-1">{project.name}</span>
                {projects.length > 1 && (
                  <button
                    onClick={e => handleDelete(e, project.id, project.name)}
                    className="opacity-0 group-hover:opacity-100 text-blue-400/60 hover:text-red-400 transition-all"
                    disabled={deletingId === project.id}
                  >
                    {deletingId === project.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />
                    }
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* New project */}
          <div className="border-t border-white/10 p-2">
            {creating ? (
              <form onSubmit={handleCreate} className="space-y-1.5">
                <input
                  autoFocus
                  className="w-full bg-white/10 text-white text-[12px] px-2 py-1.5 rounded border border-white/20 focus:outline-none focus:border-blue-400 placeholder-blue-300/40"
                  placeholder="Project name..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={100}
                />
                {error && <p className="text-[11px] text-red-400">{error}</p>}
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    disabled={saving || !newName.trim()}
                    className="flex-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white py-1 rounded disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setNewName(''); setError('') }}
                    className="px-2 text-[11px] text-blue-300/70 hover:text-blue-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-blue-300/70 hover:text-blue-200 hover:bg-white/8 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
