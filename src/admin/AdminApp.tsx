import { useState, useEffect, useRef } from 'react'
import { CATEGORIES, CategoryItem } from '../data/categories'
import { CATEGORY_RULES } from '../data/categoryRules'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleState {
  keywords: string[]
  description: string
}

type RulesState = Record<string, RuleState>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDefined(rule: RuleState): boolean {
  return rule.keywords.length > 0 || rule.description.trim().length > 0
}

function initialRules(): RulesState {
  const result: RulesState = {}
  for (const cat of CATEGORIES) {
    const existing = CATEGORY_RULES[cat.slug]
    result[cat.slug] = {
      keywords: existing?.keywords ? [...existing.keywords] : [],
      description: existing?.description ?? '',
    }
  }
  return result
}

function buildExportTs(rules: RulesState): string {
  const lines: string[] = [
    `export type CategoryRule = {`,
    `  keywords: string[];`,
    `  description: string;`,
    `};`,
    ``,
    `export type CategoryRulesMap = Record<string, CategoryRule>;`,
    ``,
    `export const CATEGORY_RULES: CategoryRulesMap = {`,
  ]
  for (const cat of CATEGORIES) {
    const rule = rules[cat.slug]
    const kws = JSON.stringify(rule.keywords)
    const desc = rule.description.replace(/`/g, "'")
    lines.push(`  '${cat.slug}': {`)
    lines.push(`    keywords: ${kws},`)
    lines.push(`    description: \`${desc}\`,`)
    lines.push(`  },`)
  }
  lines.push(`};`)
  lines.push(``)
  return lines.join('\n')
}

async function compressImage(file: File, maxKB = 150): Promise<{ dataUrl: string; sizeKB: number; origKB: number }> {
  const origKB = Math.round(file.size / 1024)
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_DIM = 512
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM }
        else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      let quality = 0.9
      const attempt = () => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Compression failed')); return }
          const sizeKB = Math.round(blob.size / 1024)
          if (sizeKB <= maxKB || quality <= 0.2) {
            const reader = new FileReader()
            reader.onload = () => resolve({ dataUrl: reader.result as string, sizeKB, origKB })
            reader.readAsDataURL(blob)
          } else {
            quality = Math.round((quality - 0.1) * 10) / 10
            attempt()
          }
        }, 'image/webp', quality)
      }
      attempt()
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onAuth }: { onAuth: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        localStorage.setItem('admin_authed', 'true')
        localStorage.setItem('admin_password', password)
        onAuth(password)
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-80">
        <div className="mb-6">
          <p className="font-mono text-xs text-zinc-500 mb-1">cent /</p>
          <h1 className="font-mono text-xl font-semibold text-white">admin</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-white text-black rounded-lg py-2 text-sm font-medium disabled:opacity-30 hover:bg-zinc-200 transition-colors"
          >
            {loading ? 'Checking…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Image uploader ───────────────────────────────────────────────────────────

const BUCKET = 'category-images'

function ImageUploader({ slug, onToast }: { slug: string; onToast: (msg: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load existing image from Supabase on mount / slug change
  useEffect(() => {
    setPreview(null)
    setStatus(null)
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${slug}.webp`)
    // Probe if it exists
    fetch(data.publicUrl, { method: 'HEAD' })
      .then(r => { if (r.ok) setPreview(data.publicUrl) })
      .catch(() => {})
  }, [slug])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('Compressing…')
    setUploading(true)
    try {
      const { dataUrl, sizeKB, origKB } = await compressImage(file)
      setStatus(origKB > 150 ? `Compressed ${origKB}KB → ${sizeKB}KB` : `${sizeKB}KB`)

      // Convert dataUrl to Blob
      const base64 = dataUrl.split(',')[1]
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'image/webp' })

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${slug}.webp`, blob, { upsert: true, contentType: 'image/webp' })

      if (error) throw error

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${slug}.webp`)
      setPreview(data.publicUrl + '?t=' + Date.now()) // bust cache
      setStatus(`Saved · ${sizeKB}KB`)
      onToast('Image saved')
    } catch (err) {
      console.error(err)
      onToast('Upload failed')
      setStatus('Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section>
      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Category Image
      </label>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover" />
            : <span className="text-zinc-600">?</span>
          }
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-1.5 text-xs hover:bg-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-40"
          >
            {uploading ? 'Uploading…' : 'Upload PNG / JPG'}
          </button>
          {status && <p className="text-[11px] text-zinc-500 font-mono">{status}</p>}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </section>
  )
}

// ─── Keyword pill ─────────────────────────────────────────────────────────────

function KeywordPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full px-2.5 py-0.5 text-xs font-mono">
      {label}
      <button onClick={onRemove} className="text-zinc-500 hover:text-zinc-200 leading-none transition-colors">×</button>
    </span>
  )
}

// ─── Category editor ──────────────────────────────────────────────────────────

function CategoryEditor({
  category, rule, onChange, onSave, onClear, isSaving, onToast,
}: {
  category: CategoryItem
  rule: RuleState
  onChange: (rule: RuleState) => void
  onSave: () => void
  onClear: () => void
  isSaving: boolean
  onToast: (msg: string) => void
}) {
  const [newKeyword, setNewKeyword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addKeyword() {
    const kw = newKeyword.trim().toLowerCase()
    if (!kw || rule.keywords.includes(kw)) return
    onChange({ ...rule, keywords: [...rule.keywords, kw] })
    setNewKeyword('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.emoji}</span>
          <div>
            <h2 className="font-semibold text-white text-base leading-tight">{category.name}</h2>
            <p className="text-xs text-zinc-500 font-mono">{category.slug} · {category.group}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Image */}
        <ImageUploader slug={category.slug} onToast={onToast} />

        {/* Keywords */}
        <section>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            Keywords
          </label>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
            {rule.keywords.length === 0 && (
              <span className="text-xs text-zinc-600 italic">No keywords yet</span>
            )}
            {rule.keywords.map(kw => (
              <KeywordPill key={kw} label={kw} onRemove={() => onChange({ ...rule, keywords: rule.keywords.filter(k => k !== kw) })} />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Add keyword…"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors font-mono"
            />
            <button
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="bg-white text-black rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-20 hover:bg-zinc-200 transition-colors"
            >
              Add
            </button>
          </div>
        </section>

        {/* Description */}
        <section>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            AI Description
          </label>
          <textarea
            value={rule.description}
            onChange={e => onChange({ ...rule, description: e.target.value })}
            rows={5}
            placeholder="Describe what belongs in this category and what doesn't — written for the AI."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed"
          />
          <p className="text-xs text-zinc-600 mt-1">Used in Gemini prompt when keywords don't match</p>
        </section>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-800 flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-white text-black rounded-lg py-2 text-sm font-medium disabled:opacity-30 hover:bg-zinc-200 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save to file'}
        </button>
        <button
          onClick={onClear}
          className="border border-zinc-700 text-zinc-500 rounded-lg px-4 py-2 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const GROUP_ORDER = [
  'Food & Drink', 'Housing & Bills', 'Entertainment', 'Transport',
  'Health & Fitness', 'Shopping & Lifestyle', 'Work & Finance', 'Income', 'Other',
]

function Sidebar({ rules, selectedSlug, search, onSearch, onSelect }: {
  rules: RulesState
  selectedSlug: string | null
  search: string
  onSearch: (v: string) => void
  onSelect: (slug: string) => void
}) {
  const filtered = CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  )
  const byGroup: Record<string, CategoryItem[]> = {}
  for (const cat of filtered) {
    if (!byGroup[cat.group]) byGroup[cat.group] = []
    byGroup[cat.group].push(cat)
  }

  return (
    <div className="w-56 shrink-0 border-r border-zinc-800 flex flex-col h-full bg-zinc-900">
      <div className="px-3 py-3 border-b border-zinc-800">
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {GROUP_ORDER.filter(g => byGroup[g]?.length).map(group => (
          <div key={group} className="mb-1">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {group}
            </p>
            {byGroup[group].map(cat => {
              const defined = isDefined(rules[cat.slug])
              const active = cat.slug === selectedSlug
              return (
                <button
                  key={cat.slug}
                  onClick={() => onSelect(cat.slug)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                    active ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.emoji}</span>
                  <span className="flex-1 truncate">{cat.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    defined ? 'bg-green-500' : 'bg-zinc-700'
                  }`} />
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Export panel ─────────────────────────────────────────────────────────────

function ExportPanel({ rules }: { rules: RulesState }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const ts = buildExportTs(rules)

  function copy() {
    navigator.clipboard.writeText(ts).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setShow(v => !v)}
          className="border border-zinc-700 text-zinc-400 rounded-lg px-3 py-1.5 text-xs hover:border-zinc-500 hover:text-zinc-200 transition-colors font-mono"
        >
          {show ? 'Hide export' : 'Export TypeScript'}
        </button>
        {show && (
          <button
            onClick={copy}
            className="border border-zinc-700 text-zinc-400 rounded-lg px-3 py-1.5 text-xs hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        )}
      </div>
      {show && (
        <pre className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl p-4 text-xs font-mono overflow-auto max-h-64 leading-relaxed">
          {ts}
        </pre>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-mono px-4 py-2 rounded-full shadow-xl z-50">
      {message}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ adminPassword, onLogout }: { adminPassword: string; onLogout: () => void }) {
  const [rules, setRules] = useState<RulesState>(initialRules)
  const [selectedSlug, setSelectedSlug] = useState<string>(CATEGORIES[0].slug)
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const definedCount = CATEGORIES.filter(cat => isDefined(rules[cat.slug])).length
  const progress = definedCount / CATEGORIES.length

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function saveToFile() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
        body: JSON.stringify({ rules }),
      })
      showToast(res.ok ? 'Saved to categoryRules.ts' : 'Save failed')
    } catch {
      showToast('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCategory = CATEGORIES.find(c => c.slug === selectedSlug)!
  const selectedRule = rules[selectedSlug]

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-zinc-500">cent / admin</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{definedCount} of {CATEGORIES.length} defined</span>
            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors font-mono">
          Logout
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <Sidebar rules={rules} selectedSlug={selectedSlug} search={search} onSearch={setSearch} onSelect={setSelectedSlug} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CategoryEditor
              category={selectedCategory}
              rule={selectedRule}
              onChange={rule => setRules(prev => ({ ...prev, [selectedSlug]: rule }))}
              onSave={saveToFile}
              onClear={() => setRules(prev => ({ ...prev, [selectedSlug]: { keywords: [], description: '' } }))}
              isSaving={isSaving}
              onToast={showToast}
            />
          </div>
          <ExportPanel rules={rules} />
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [authed, setAuthed] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('admin_authed')
    const pw = localStorage.getItem('admin_password')
    if (stored === 'true' && pw) { setAdminPassword(pw); setAuthed(true) }
  }, [])

  function handleAuth(password: string) { setAdminPassword(password); setAuthed(true) }

  function handleLogout() {
    localStorage.removeItem('admin_authed')
    localStorage.removeItem('admin_password')
    setAuthed(false)
    setAdminPassword('')
  }

  if (!authed) return <LoginScreen onAuth={handleAuth} />
  return <Dashboard adminPassword={adminPassword} onLogout={handleLogout} />
}
