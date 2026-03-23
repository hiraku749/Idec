'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, ChevronDown } from 'lucide-react'

export interface AiPersona {
  id: string
  name: string
  description: string
  system_prompt: string
  icon: string
}

const BUILTIN_PERSONAS = [
  { id: 'rational',  name: '論理型',   icon: '🧠', description: '根拠・データを重視した客観的な回答' },
  { id: 'balanced',  name: 'バランス型', icon: '⚖️', description: '論理性と共感性のバランスを取った回答' },
  { id: 'ethical',   name: '倫理型',   icon: '🌿', description: '社会的影響・倫理観を重視した回答' },
]

interface Props {
  selectedId: string        // builtin id or custom persona uuid
  onSelect: (id: string, systemPromptOverride?: string) => void
}

export function PersonaSelector({ selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [personas, setPersonas] = useState<AiPersona[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<AiPersona | null>(null)

  async function loadPersonas() {
    const res = await fetch('/api/personas').catch(() => null)
    if (!res?.ok) return
    const data = await res.json() as AiPersona[]
    setPersonas(data)
  }

  useEffect(() => { void loadPersonas() }, [])

  const selectedBuiltin = BUILTIN_PERSONAS.find((p) => p.id === selectedId)
  const selectedCustom = personas.find((p) => p.id === selectedId)
  const displayName = selectedBuiltin?.name ?? selectedCustom?.name ?? 'バランス型'
  const displayIcon = selectedBuiltin?.icon ?? selectedCustom?.icon ?? '⚖️'

  async function handleDelete(id: string) {
    if (!confirm('この人格を削除しますか？')) return
    await fetch(`/api/personas/${id}`, { method: 'DELETE' })
    if (selectedId === id) onSelect('balanced')
    await loadPersonas()
  }

  function handleEditOpen(p: AiPersona) {
    setEditTarget(p)
    setShowForm(true)
    setOpen(false)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditTarget(null)
  }

  async function handleFormSave(data: Omit<AiPersona, 'id'>) {
    if (editTarget) {
      await fetch(`/api/personas/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    await loadPersonas()
    handleFormClose()
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border hover:bg-accent transition-colors"
        >
          <span>{displayIcon}</span>
          <span>{displayName}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border bg-popover shadow-lg z-50 overflow-hidden">
            <div className="p-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5">デフォルト</p>
              {BUILTIN_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setOpen(false) }}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-accent ${selectedId === p.id ? 'bg-accent font-medium' : ''}`}
                >
                  <span className="text-base shrink-0">{p.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                  </div>
                </button>
              ))}

              {personas.length > 0 && (
                <>
                  <div className="border-t my-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1.5">カスタム人格</p>
                  {personas.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-1 rounded-lg transition-colors ${selectedId === p.id ? 'bg-accent' : 'hover:bg-accent/60'}`}
                    >
                      <button
                        onClick={() => { onSelect(p.id, p.system_prompt); setOpen(false) }}
                        className="flex-1 flex items-start gap-2.5 px-2.5 py-2 text-left"
                      >
                        <span className="text-base shrink-0">{p.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                        </div>
                      </button>
                      <button onClick={() => handleEditOpen(p)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => void handleDelete(p.id)} className="p-1.5 mr-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </>
              )}

              <div className="border-t mt-1 pt-1">
                <button
                  onClick={() => { setShowForm(true); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新しい人格を作る
                </button>
              </div>
            </div>
          </div>
        )}
        {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      </div>

      {showForm && (
        <PersonaFormModal
          initial={editTarget}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </>
  )
}

// ── 人格作成・編集モーダル ──────────────────────────────

function PersonaFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial: AiPersona | null
  onSave: (data: Omit<AiPersona, 'id'>) => Promise<void>
  onClose: () => void
}) {
  const [icon, setIcon] = useState(initial?.icon ?? '🤖')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(initial?.system_prompt ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    if (systemPrompt.trim().length < 10) { setError('システムプロンプトは10文字以上必要です'); return }
    setSaving(true)
    await onSave({ icon, name: name.trim(), description: description.trim(), system_prompt: systemPrompt.trim() })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border rounded-xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{initial ? '人格を編集' : '新しい人格を作る'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="w-16">
            <label className="text-xs text-muted-foreground block mb-1">アイコン</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full text-center text-2xl border rounded-lg py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={4}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">名前 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 厳しいメンター"
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">説明（一言メモ）</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: 厳しく批判しながら本質を引き出すメンター"
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            maxLength={200}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            システムプロンプト *
            <span className="ml-1 text-[10px]">（このAIはどういう人格か・どう振る舞うか）</span>
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={`例:\nあなたは経験豊富なスタートアップ起業家であり、厳しくも的確なフィードバックを与えるメンターです。\nユーザーのアイデアの甘い点を遠慮なく指摘し、市場の現実を教えてください。\n日本語で回答してください。`}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={6}
            maxLength={2000}
          />
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{systemPrompt.length}/2000</p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border hover:bg-accent transition-colors">
            キャンセル
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
