import { useState, useEffect, useRef } from 'react'
import { CATEGORIES, CategoryItem } from '../data/categories'
import { CATEGORY_RULES } from '../data/categoryRules'

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
      setError('Network error — check console')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-80 shadow-sm">
        <div className="mb-6">
          <p className="font-mono text-xs text-gray-400 mb-1">cent /</p>
          <h1 className="font-mono text-xl font-semibold text-gray-900">admin</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {loading ? 'Checking…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Keyword pill ─────────────────────────────────────────────────────────────

function KeywordPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 text-xs font-mono">
      {label}
      <button
        onClick={onRemove}
        className="text-blue-400 hover:text-blue-700 leading-none"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  )
}

// ─── Category editor ──────────────────────────────────────────────────────────

function CategoryEditor({
  category,
  rule,
  onChange,
  onSave,
  onClear,
  isSaving,
}: {
  category: CategoryItem
  rule: RuleState
  onChange: (rule: RuleState) => void
  onSave: () => void
  onClear: () => void
  isSaving: boolean
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

  function removeKeyword(kw: string) {
    onChange({ ...rule, keywords: rule.keywords.filter(k => k !== kw) })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.emoji}</span>
          <div>
            <h2 className="font-semibold text-gray-900 text-base leading-tight">{category.name}</h2>
            <p className="text-xs text-gray-400 font-mono">{category.slug} · {category.group}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Keywords */}
        <section>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Keywords
          </label>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
            {rule.keywords.length === 0 && (
              <span className="text-xs text-gray-300 italic">No keywords yet</span>
            )}
            {rule.keywords.map(kw => (
              <KeywordPill key={kw} label={kw} onRemove={() => removeKeyword(kw)} />
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
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400 transition-colors font-mono"
            />
            <button
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="bg-gray-900 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              Add
            </button>
          </div>
        </section>

        {/* Description */}
        <section>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            AI Description
          </label>
          <textarea
            value={rule.description}
            onChange={e => onChange({ ...rule, description: e.target.value })}
            rows={5}
            placeholder="Describe what belongs in this category and what doesn't — written for the AI."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1">Used in Gemini prompt when keywords don't match</p>
        </section>
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save to file'}
        </button>
        <button
          onClick={onClear}
          className="border border-gray-200 text-gray-500 rounded-lg px-4 py-2 text-sm hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          Clear rules
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const GROUP_ORDER = [
  'Food & Drink',
  'Housing & Bills',
  'Entertainment',
  'Transport',
  'Health & Fitness',
  'Shopping & Lifestyle',
  'Work & Finance',
  'Income',
  'Other',
]

function Sidebar({
  rules,
  selectedSlug,
  search,
  onSearch,
  onSelect,
}: {
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
    <div className="w-56 shrink-0 border-r border-gray-100 flex flex-col h-full bg-gray-50">
      <div className="px-3 py-3 border-b border-gray-100">
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gray-400 transition-colors"
        />
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {GROUP_ORDER.filter(g => byGroup[g]?.length).map(group => (
          <div key={group} className="mb-1">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
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
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.emoji}</span>
                  <span className="flex-1 truncate">{cat.name}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      defined
                        ? active ? 'bg-green-400' : 'bg-green-500'
                        : active ? 'bg-gray-500' : 'bg-gray-300'
                    }`}
                  />
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
    <div className="border-t border-gray-100 px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setShow(v => !v)}
          className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs hover:border-gray-400 transition-colors font-mono"
        >
          {show ? 'Hide export' : 'Export TypeScript'}
        </button>
        {show && (
          <button
            onClick={copy}
            className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs hover:border-gray-400 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        )}
      </div>
      {show && (
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs font-mono overflow-auto max-h-64 leading-relaxed">
          {ts}
        </pre>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-mono px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in">
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

  function updateRule(slug: string, rule: RuleState) {
    setRules(prev => ({ ...prev, [slug]: rule }))
  }

  function clearRule(slug: string) {
    setRules(prev => ({ ...prev, [slug]: { keywords: [], description: '' } }))
  }

  async function saveToFile() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ rules }),
      })
      if (res.ok) {
        showToast('Saved to categoryRules.ts')
      } else {
        showToast('Save failed — check console')
      }
    } catch {
      showToast('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCategory = CATEGORIES.find(c => c.slug === selectedSlug)!
  const selectedRule = rules[selectedSlug]

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-400">cent / admin</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{definedCount} of {CATEGORIES.length} defined</span>
            <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-mono"
        >
          Logout
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          rules={rules}
          selectedSlug={selectedSlug}
          search={search}
          onSearch={setSearch}
          onSelect={setSelectedSlug}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CategoryEditor
              category={selectedCategory}
              rule={selectedRule}
              onChange={rule => updateRule(selectedSlug, rule)}
              onSave={saveToFile}
              onClear={() => clearRule(selectedSlug)}
              isSaving={isSaving}
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
    if (stored === 'true' && pw) {
      setAdminPassword(pw)
      setAuthed(true)
    }
  }, [])

  function handleAuth(password: string) {
    setAdminPassword(password)
    setAuthed(true)
  }

  function handleLogout() {
    localStorage.removeItem('admin_authed')
    localStorage.removeItem('admin_password')
    setAuthed(false)
    setAdminPassword('')
  }

  if (!authed) {
    return <LoginScreen onAuth={handleAuth} />
  }

  return <Dashboard adminPassword={adminPassword} onLogout={handleLogout} />
}
