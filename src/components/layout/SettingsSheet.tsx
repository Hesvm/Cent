import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Setting2, Profile, Wallet2, DollarCircle, Moon, Notification,
  Category2, ExportSquare, InfoCircle, ArrowRight2, ArrowLeft2,
  CloseCircle, AddCircle, SearchNormal1, TickCircle, Share, Star1,
  type Icon as IcIcon,
} from 'iconsax-react'
import { CATEGORIES } from '../../config/categories'
import { TransactionImage } from '../ui/TransactionImage'
import { useExpense } from '../../context/ExpenseContext'
import { useTheme, type Theme } from '../../hooks/useTheme'

interface Props {
  onClose: () => void
  onOpenBudget: () => void
}

type Page =
  | 'profile'
  | 'currency'
  | 'appearance'
  | 'notifications'
  | 'categories'
  | 'export'
  | 'about'

// ─── Reusable row ─────────────────────────────────────────────────────────────
function Row({
  icon,
  label,
  onTap,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onTap: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onTap}
      className="flex items-center w-full px-5 h-[52px] gap-3 hover:bg-bg-secondary active:bg-bg-secondary transition-colors text-left"
    >
      <span className="flex-shrink-0">{icon}</span>
      <span
        className="flex-1 text-[15px] font-rounded truncate"
        style={{ color: destructive ? 'var(--color-expense)' : 'var(--color-text-primary)', fontWeight: 400 }}
      >
        {label}
      </span>
      <span className="flex-shrink-0">
        <ArrowRight2 size={16} variant="Linear" color="var(--color-text-hint)" />
      </span>
    </button>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-5 pt-5 pb-2 text-[11px] font-semibold tracking-[0.8px] uppercase text-text-tertiary font-rounded">
      {label}
    </p>
  )
}

function Divider() {
  return <div className="mx-5 h-px bg-bg-secondary" />
}

// ─── Sub-page header ──────────────────────────────────────────────────────────
function SubPageHeader({ title, icon: Icon, onBack }: { title: string; icon: IcIcon; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-secondary sticky top-0 bg-bg-card z-10">
      <button onClick={onBack} className="p-1">
        <ArrowLeft2 size={20} variant="Linear" color="currentColor" />
      </button>
      <span className="text-[17px] font-semibold text-text-primary font-rounded flex-1">{title}</span>
      <Icon size={24} variant="Bulk" color="currentColor" />
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? 'var(--toggle-on-bg)' : 'var(--toggle-off-bg)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        padding: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: on ? 'var(--toggle-on-thumb)' : 'var(--toggle-off-thumb)',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ─── PROFILE page ─────────────────────────────────────────────────────────────
function ProfilePage({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('Hesam')
  const [saved, setSaved] = useState(false)
  const originalName = 'Hesam'
  const isDirty = name !== originalName

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div>
      <SubPageHeader title="Profile" icon={Profile} onBack={onBack} />
      <div className="px-5 py-8 flex flex-col items-center gap-6">
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#F5A623',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: '#fff',
        }} className="font-rounded">
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Name input */}
        <div className="w-full">
          <label className="text-[12px] text-text-tertiary font-rounded font-semibold tracking-[0.6px] uppercase mb-1 block">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-[16px] font-rounded text-text-primary bg-transparent border-b border-[var(--color-border-dashed)] pb-2 focus:outline-none focus:border-[#1A1A1A] transition-colors"
          />
        </div>

        {/* Email read-only */}
        <div className="w-full">
          <label className="text-[12px] text-text-tertiary font-rounded font-semibold tracking-[0.6px] uppercase mb-1 block">Email</label>
          <p className="text-[15px] font-rounded pb-2 border-b border-bg-secondary" style={{ color: 'var(--color-text-secondary)' }}>hesam@gmail.com</p>
        </div>

        {/* Member since read-only */}
        <div className="w-full">
          <label className="text-[12px] text-text-tertiary font-rounded font-semibold tracking-[0.6px] uppercase mb-1 block">Member Since</label>
          <p className="text-[15px] font-rounded pb-2 border-b border-bg-secondary" style={{ color: 'var(--color-text-secondary)' }}>January 2025</p>
        </div>

        {/* Save button — slides in only when dirty */}
        <AnimatePresence>
          {isDirty && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={handleSave}
              className="w-full py-3.5 rounded-pill text-[15px] font-semibold font-rounded text-white bg-[#1A1A1A]"
            >
              {saved ? 'Saved ✓' : 'Save Changes'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── CURRENCY page ────────────────────────────────────────────────────────────
const POPULAR_CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'IRR', symbol: '﷼' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'TRY', symbol: '₺' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CHF', symbol: 'Fr' },
  { code: 'INR', symbol: '₹' },
]

const ALL_CURRENCIES = [
  { code: 'AFN', symbol: '؋' },
  { code: 'ALL', symbol: 'L' },
  { code: 'AMD', symbol: '֏' },
  { code: 'ARS', symbol: '$' },
  { code: 'BDT', symbol: '৳' },
  { code: 'BGN', symbol: 'лв' },
  { code: 'BHD', symbol: '.د.ب' },
  { code: 'BOB', symbol: 'Bs.' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'BWP', symbol: 'P' },
  { code: 'BYR', symbol: 'Br' },
  { code: 'BZD', symbol: 'BZ$' },
  { code: 'CLP', symbol: '$' },
  { code: 'CNY', symbol: '¥' },
  { code: 'COP', symbol: '$' },
  { code: 'CRC', symbol: '₡' },
  { code: 'CZK', symbol: 'Kč' },
  { code: 'DKK', symbol: 'kr' },
  { code: 'DZD', symbol: 'دج' },
  { code: 'EGP', symbol: '£' },
  { code: 'ETB', symbol: 'Br' },
  { code: 'GEL', symbol: '₾' },
  { code: 'GHS', symbol: '₵' },
  { code: 'GTQ', symbol: 'Q' },
  { code: 'HKD', symbol: '$' },
  { code: 'HRK', symbol: 'kn' },
  { code: 'HUF', symbol: 'Ft' },
  { code: 'IDR', symbol: 'Rp' },
  { code: 'ILS', symbol: '₪' },
  { code: 'IQD', symbol: 'ع.د' },
  { code: 'ISK', symbol: 'kr' },
  { code: 'JOD', symbol: 'JD' },
  { code: 'KES', symbol: 'KSh' },
  { code: 'KWD', symbol: 'KD' },
  { code: 'KZT', symbol: '₸' },
  { code: 'LBP', symbol: '£' },
  { code: 'MAD', symbol: 'MAD' },
  { code: 'MXN', symbol: '$' },
  { code: 'MYR', symbol: 'RM' },
  { code: 'NGN', symbol: '₦' },
  { code: 'NOK', symbol: 'kr' },
  { code: 'NZD', symbol: '$' },
  { code: 'OMR', symbol: '﷼' },
  { code: 'PHP', symbol: '₱' },
  { code: 'PKR', symbol: '₨' },
  { code: 'PLN', symbol: 'zł' },
  { code: 'QAR', symbol: '﷼' },
  { code: 'RON', symbol: 'lei' },
  { code: 'RUB', symbol: '₽' },
  { code: 'SAR', symbol: '﷼' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'SGD', symbol: '$' },
  { code: 'THB', symbol: '฿' },
  { code: 'TWD', symbol: 'NT$' },
  { code: 'UAH', symbol: '₴' },
  { code: 'UGX', symbol: 'USh' },
  { code: 'UZS', symbol: 'лв' },
  { code: 'VND', symbol: '₫' },
  { code: 'XAF', symbol: 'FCFA' },
  { code: 'XOF', symbol: 'CFA' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'ZMW', symbol: 'ZK' },
]

function CurrencyPage({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(() => localStorage.getItem('cent_currency') || 'USD')
  const [search, setSearch] = useState('')

  function handleSelect(code: string) {
    setSelected(code)
    localStorage.setItem('cent_currency', code)
    setTimeout(onBack, 300)
  }

  const query = search.toLowerCase()
  const allCurrencies = [...POPULAR_CURRENCIES, ...ALL_CURRENCIES]
  const filteredPopular = POPULAR_CURRENCIES.filter(c => !query || c.code.toLowerCase().includes(query))
  const filteredAll = ALL_CURRENCIES.filter(c => !query || c.code.toLowerCase().includes(query))

  // When searching, merge all into one list
  const isSearching = query.length > 0
  const searchResults = allCurrencies.filter(c => c.code.toLowerCase().includes(query))

  return (
    <div>
      <SubPageHeader title="Currency" icon={DollarCircle} onBack={onBack} />

      {/* Search */}
      <div className="px-5 py-3 border-b border-bg-secondary sticky top-[69px] bg-bg-card z-10">
        <div className="flex items-center gap-2 bg-bg-secondary rounded-xl px-3 h-9">
          <SearchNormal1 size={15} variant="Linear" color="var(--color-text-tertiary)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search currency..."
            className="flex-1 text-[14px] bg-transparent focus:outline-none text-text-primary placeholder:text-text-tertiary font-rounded"
          />
        </div>
      </div>

      {isSearching ? (
        <div>
          {searchResults.map((c, i) => (
            <div key={c.code}>
              <CurrencyRow c={c} selected={selected} onSelect={handleSelect} />
              {i < searchResults.length - 1 && <Divider />}
            </div>
          ))}
          {searchResults.length === 0 && (
            <p className="px-5 py-8 text-center text-[14px] text-text-tertiary font-rounded">No currencies found</p>
          )}
        </div>
      ) : (
        <>
          <p className="px-5 pt-4 pb-2 text-[11px] font-semibold tracking-[0.8px] uppercase text-text-tertiary font-rounded">Popular</p>
          {filteredPopular.map((c, i) => (
            <div key={c.code}>
              <CurrencyRow c={c} selected={selected} onSelect={handleSelect} />
              {i < filteredPopular.length - 1 && <Divider />}
            </div>
          ))}
          <p className="px-5 pt-5 pb-2 text-[11px] font-semibold tracking-[0.8px] uppercase text-text-tertiary font-rounded">All Currencies</p>
          {filteredAll.map((c, i) => (
            <div key={c.code}>
              <CurrencyRow c={c} selected={selected} onSelect={handleSelect} />
              {i < filteredAll.length - 1 && <Divider />}
            </div>
          ))}
        </>
      )}
      <div className="h-8" />
    </div>
  )
}

function CurrencyRow({ c, selected, onSelect }: { c: { code: string; symbol: string }; selected: string; onSelect: (code: string) => void }) {
  const isSelected = selected === c.code
  return (
    <button
      onClick={() => onSelect(c.code)}
      className="flex items-center w-full px-5 h-[52px] gap-3 hover:bg-bg-secondary active:bg-bg-secondary transition-colors text-left"
    >
      <span className="w-10 text-[16px] font-rounded font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.symbol}</span>
      <span className="flex-1 text-[15px] font-rounded text-text-primary">{c.code}</span>
      {isSelected && <TickCircle size={20} variant="Bold" color="var(--color-text-primary)" />}
    </button>
  )
}

// ─── APPEARANCE page ──────────────────────────────────────────────────────────
function AppearancePage({ onBack }: { onBack: () => void }) {
  const { theme, setTheme } = useTheme()

  const options: { key: Theme; label: string; icon: string }[] = [
    { key: 'light', label: 'Light', icon: '☀️' },
    { key: 'dark', label: 'Dark', icon: '🌙' },
    { key: 'auto', label: 'Auto', icon: '✦' },
  ]

  return (
    <div>
      <SubPageHeader title="Appearance" icon={Moon} onBack={onBack} />
      <div className="px-5 py-6">
        <div className="flex gap-3">
          {options.map((opt) => {
            const isSelected = theme === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className="flex-1 flex flex-col items-center gap-2 transition-colors"
                style={{
                  borderRadius: 12,
                  padding: '16px 12px',
                  border: `1.5px solid ${isSelected ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-bg-card)',
                }}
              >
                <span style={{ fontSize: 24 }}>{opt.icon}</span>
                <span className="text-[13px] font-rounded font-medium text-text-primary">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── NOTIFICATIONS page ───────────────────────────────────────────────────────
type NotifKey =
  | 'master'
  | 'RT-01' | 'RT-04'
  | 'RT-02' | 'RT-03' | 'DD-07' | 'DD-08' | 'DD-02'
  | 'DD-06' | 'DD-05'

interface NotifState {
  master: boolean
  'RT-01': boolean
  'RT-04': boolean
  'RT-02': boolean
  'RT-03': boolean
  'DD-07': boolean
  'DD-08': boolean
  'DD-02': boolean
  'DD-06': boolean
  'DD-05': boolean
}

const DEFAULT_NOTIF: NotifState = {
  master: true,
  'RT-01': true,
  'RT-04': true,
  'RT-02': true,
  'RT-03': false,
  'DD-07': true,
  'DD-08': false,
  'DD-02': true,
  'DD-06': true,
  'DD-05': false,
}

function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<NotifState>(() => {
    try {
      const stored = localStorage.getItem('cent_notifications')
      return stored ? { ...DEFAULT_NOTIF, ...JSON.parse(stored) } : DEFAULT_NOTIF
    } catch {
      return DEFAULT_NOTIF
    }
  })

  function toggle(key: NotifKey) {
    const next = { ...state, [key]: !state[key] }
    setState(next)
    localStorage.setItem('cent_notifications', JSON.stringify(next))
  }

  const masterOff = !state.master

  function NotifRow({ id, label, master: isMaster }: { id: NotifKey; label: string; master?: boolean }) {
    return (
      <div
        className="flex items-center w-full px-5 h-[52px] gap-3"
        style={{ opacity: masterOff && !isMaster ? 0.4 : 1 }}
      >
        <span className="flex-1 text-[15px] font-rounded" style={{ fontWeight: isMaster ? 600 : 400, color: 'var(--color-text-primary)' }}>
          {label}
        </span>
        <Toggle
          on={state[id]}
          onChange={() => toggle(id)}
          disabled={masterOff && !isMaster}
        />
      </div>
    )
  }

  const groups: { title: string; rows: { id: NotifKey; label: string; master?: boolean }[] }[] = [
    {
      title: 'Budget Alerts',
      rows: [
        { id: 'RT-01', label: 'Budget threshold reached' },
        { id: 'RT-04', label: 'Went over budget' },
      ],
    },
    {
      title: 'Spending Insights',
      rows: [
        { id: 'RT-02', label: 'Large single transaction' },
        { id: 'RT-03', label: 'Daily category spike' },
        { id: 'DD-07', label: 'Monthly spending summary' },
        { id: 'DD-08', label: 'Weekly check-in' },
        { id: 'DD-02', label: 'Burn rate warning' },
      ],
    },
    {
      title: 'Engagement',
      rows: [
        { id: 'DD-06', label: 'Inactivity reminder' },
        { id: 'DD-05', label: 'Spending streak milestone' },
      ],
    },
    {
      title: 'Master Control',
      rows: [
        { id: 'master', label: 'All notifications', master: true },
      ],
    },
  ]

  return (
    <div>
      <SubPageHeader title="Notifications" icon={Notification} onBack={onBack} />
      {groups.map((group) => (
        <div key={group.title}>
          <SectionHeader label={group.title} />
          {group.rows.map((row, ri) => (
            <div key={row.id}>
              <NotifRow id={row.id} label={row.label} master={row.master} />
              {ri < group.rows.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      ))}
      <div className="h-8" />
    </div>
  )
}

// ─── CATEGORIES page ──────────────────────────────────────────────────────────
function CategoriesPage({ onBack }: { onBack: () => void }) {
  const [custom, setCustom] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cent_custom_categories')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [newCat, setNewCat] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function addCategory() {
    const trimmed = newCat.trim()
    if (!trimmed || custom.includes(trimmed)) return
    const next = [...custom, trimmed]
    setCustom(next)
    localStorage.setItem('cent_custom_categories', JSON.stringify(next))
    setNewCat('')
  }

  function deleteCategory(name: string) {
    if (confirmDelete === name) {
      const next = custom.filter((c) => c !== name)
      setCustom(next)
      localStorage.setItem('cent_custom_categories', JSON.stringify(next))
      setConfirmDelete(null)
    } else {
      setConfirmDelete(name)
    }
  }

  return (
    <div>
      <SubPageHeader title="Categories" icon={Category2} onBack={onBack} />

      {/* Custom categories */}
      <SectionHeader label="Custom Categories" />
      {custom.length === 0 && (
        <p className="px-5 pb-2 text-[13px] text-text-tertiary font-rounded">No custom categories yet.</p>
      )}
      {custom.map((name, i) => (
        <div key={name}>
          <div className="flex items-center w-full px-5 h-[52px] gap-3">
            <span className="flex-1 text-[15px] font-rounded text-text-primary">{name}</span>
            {confirmDelete === name ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-secondary font-rounded">Confirm?</span>
                <button onClick={() => deleteCategory(name)} className="text-[12px] font-semibold text-expense font-rounded">Delete</button>
                <button onClick={() => setConfirmDelete(null)} className="text-[12px] font-semibold text-text-primary font-rounded">Cancel</button>
              </div>
            ) : (
              <button onClick={() => deleteCategory(name)}>
                <CloseCircle size={20} variant="Bold" color="var(--color-text-hint)" />
              </button>
            )}
          </div>
          {i < custom.length - 1 && <Divider />}
        </div>
      ))}

      {/* Add new */}
      <div className="px-5 py-3 flex items-center gap-2">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addCategory() }}
          placeholder="Add a category..."
          className="flex-1 text-[14px] font-rounded bg-transparent border-b border-[var(--color-border-dashed)] pb-1.5 focus:outline-none focus:border-[#1A1A1A] placeholder:text-text-tertiary text-text-primary transition-colors"
        />
        <button onClick={addCategory} className="flex-shrink-0">
          <AddCircle size={24} variant="Bold" color={newCat.trim() ? '#1A1A1A' : '#CCCCCC'} />
        </button>
      </div>

      {/* Built-in categories */}
      <SectionHeader label="Built-in Categories" />
      {CATEGORIES.map((cat, i) => (
        <div key={cat.name}>
          <div className="flex items-center w-full px-5 h-[52px] gap-3">
            <TransactionImage category={cat.name} name={cat.name} size={28} />
            <span className="flex-1 text-[15px] font-rounded text-text-primary">{cat.name}</span>
            <span className="text-[12px] text-text-tertiary font-rounded">{cat.group}</span>
          </div>
          {i < CATEGORIES.length - 1 && <Divider />}
        </div>
      ))}
      <div className="h-8" />
    </div>
  )
}

// ─── EXPORT page ──────────────────────────────────────────────────────────────
type DateRange = 'this-month' | 'last-month' | 'last-3' | 'last-6' | 'this-year' | 'all'
type ExportFormat = 'csv' | 'pdf'

function getDateRange(range: DateRange): { start: Date; end: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (range) {
    case 'this-month': return { start: new Date(y, m, 1), end: now }
    case 'last-month': return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) }
    case 'last-3': return { start: new Date(y, m - 3, 1), end: now }
    case 'last-6': return { start: new Date(y, m - 6, 1), end: now }
    case 'this-year': return { start: new Date(y, 0, 1), end: now }
    case 'all': return { start: new Date(0), end: now }
  }
}

interface Transaction {
  date: Date
  name: string
  amount: number
  type: string
  category: string | null
  frequency: string
  notes: string
}

function generateCSV(transactions: Transaction[], opts: { expenses: boolean; income: boolean; notes: boolean; category: boolean }) {
  const headers = ['Date', 'Name', 'Amount', 'Type', ...(opts.category ? ['Category'] : []), 'Frequency', ...(opts.notes ? ['Notes'] : [])]
  const rows = transactions
    .filter(t => (t.type === 'expense' && opts.expenses) || (t.type === 'income' && opts.income))
    .map(t => [
      t.date.toISOString().slice(0, 10),
      t.name,
      t.amount.toString(),
      t.type,
      ...(opts.category ? [t.category ?? ''] : []),
      t.frequency,
      ...(opts.notes ? [t.notes] : []),
    ])
  return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}

function ExportPage({ onBack }: { onBack: () => void }) {
  const { transactions } = useExpense()
  const [dateRange, setDateRange] = useState<DateRange>('this-month')
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [incExpenses, setIncExpenses] = useState(true)
  const [incIncome, setIncIncome] = useState(true)
  const [incNotes, setIncNotes] = useState(true)
  const [incCategory, setIncCategory] = useState(true)

  function handleExport() {
    const { start, end } = getDateRange(dateRange)
    const filtered = transactions.filter(t => t.date >= start && t.date <= end)
    if (format === 'csv') {
      const csv = generateCSV(filtered, { expenses: incExpenses, income: incIncome, notes: incNotes, category: incCategory })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cent-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert('PDF export coming soon!')
    }
  }

  const rangeLabels: Record<DateRange, string> = {
    'this-month': 'This month',
    'last-month': 'Last month',
    'last-3': 'Last 3 months',
    'last-6': 'Last 6 months',
    'this-year': 'This year',
    'all': 'All time',
  }

  return (
    <div>
      <SubPageHeader title="Export Data" icon={ExportSquare} onBack={onBack} />

      {/* Date range */}
      <SectionHeader label="Date Range" />
      <div className="px-5 pb-2">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="w-full text-[15px] font-rounded text-text-primary bg-bg-secondary rounded-xl px-4 h-12 focus:outline-none"
        >
          {(Object.keys(rangeLabels) as DateRange[]).map(k => (
            <option key={k} value={k}>{rangeLabels[k]}</option>
          ))}
        </select>
      </div>

      {/* Format */}
      <SectionHeader label="Format" />
      <div className="px-5 pb-2 flex gap-3">
        {(['csv', 'pdf'] as ExportFormat[]).map((f) => {
          const isSelected = format === f
          return (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="flex-1 flex flex-col items-center gap-2 transition-colors"
              style={{
                borderRadius: 12,
                padding: '16px 12px',
                border: `1.5px solid ${isSelected ? '#1A1A1A' : '#E5E5E5'}`,
                background: isSelected ? '#F5F5F5' : '#fff',
              }}
            >
              <span style={{ fontSize: 22 }}>{f === 'csv' ? '📊' : '📄'}</span>
              <span className="text-[13px] font-rounded font-medium text-text-primary uppercase">{f}</span>
            </button>
          )
        })}
      </div>

      {/* Toggles */}
      <SectionHeader label="Include" />
      {[
        { label: 'Expenses', value: incExpenses, onChange: setIncExpenses },
        { label: 'Income', value: incIncome, onChange: setIncIncome },
        { label: 'Notes', value: incNotes, onChange: setIncNotes },
        { label: 'Category', value: incCategory, onChange: setIncCategory },
      ].map((item, i, arr) => (
        <div key={item.label}>
          <div className="flex items-center w-full px-5 h-[52px] gap-3">
            <span className="flex-1 text-[15px] font-rounded text-text-primary">{item.label}</span>
            <Toggle on={item.value} onChange={item.onChange} />
          </div>
          {i < arr.length - 1 && <Divider />}
        </div>
      ))}

      {/* Export button */}
      <div className="px-5 pt-6" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleExport}
          className="w-full py-3.5 rounded-pill text-[15px] font-semibold font-rounded text-white bg-[#1A1A1A]"
        >
          Export
        </button>
      </div>
    </div>
  )
}

// ─── ABOUT page ───────────────────────────────────────────────────────────────
function AboutPage({ onBack }: { onBack: () => void }) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'Cent', text: 'Check out Cent — a simple expense tracker!', url: 'https://cent.app' }).catch(() => {})
    } else {
      navigator.clipboard.writeText('https://cent.app').then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div>
      <SubPageHeader title="About Cent" icon={InfoCircle} onBack={onBack} />
      <div className="flex flex-col items-center px-5 py-8 gap-2">
        <span style={{ fontSize: 60 }}>🪙</span>
        <span className="text-[20px] font-semibold font-rounded text-text-primary">Cent</span>
        <span className="text-[13px] font-rounded" style={{ color: 'var(--color-text-tertiary)' }}>Version 1.0.0</span>
      </div>

      <div className="px-5">
        {[
          {
            icon: <InfoCircle size={20} variant="Bold" color="var(--color-text-secondary)" />,
            label: 'Privacy Policy',
            action: () => window.open('https://cent.app/privacy', '_blank'),
          },
          {
            icon: <InfoCircle size={20} variant="Bold" color="var(--color-text-secondary)" />,
            label: 'Terms of Service',
            action: () => window.open('https://cent.app/terms', '_blank'),
          },
          {
            icon: <Star1 size={20} variant="Bold" color="var(--color-text-secondary)" />,
            label: 'Rate Cent',
            action: () => window.open('https://cent.app/rate', '_blank'),
          },
          {
            icon: <Share size={20} variant="Bold" color="var(--color-text-secondary)" />,
            label: copied ? 'Link copied!' : 'Share Cent',
            action: handleShare,
          },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <button
              onClick={item.action}
              className="flex items-center w-full h-[52px] gap-3 hover:bg-bg-secondary active:bg-bg-secondary transition-colors text-left rounded-xl px-1"
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-[15px] font-rounded text-text-primary">{item.label}</span>
              <ArrowRight2 size={16} variant="Linear" color="var(--color-text-hint)" />
            </button>
            {i < arr.length - 1 && <Divider />}
          </div>
        ))}
      </div>

      <p className="text-center text-[13px] text-text-tertiary font-rounded pt-8 pb-4">Made with ♥ by Hesam</p>
    </div>
  )
}

// ─── Sheet ────────────────────────────────────────────────────────────────────
export function SettingsSheet({ onClose, onOpenBudget }: Props) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [activePage, setActivePage] = useState<Page | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Reset scroll when sub-page opens/closes
  useEffect(() => {
    if (sheetRef.current) sheetRef.current.scrollTop = 0
  }, [activePage])

  const SECTIONS = [
    {
      title: 'Account',
      rows: [
        { icon: <Profile size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Profile', onTap: () => setActivePage('profile') },
      ],
    },
    {
      title: 'Finance',
      rows: [
        { icon: <Wallet2 size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Budget', onTap: () => { onClose(); onOpenBudget() } },
        { icon: <DollarCircle size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Currency', onTap: () => setActivePage('currency') },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        { icon: <Moon size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Appearance', onTap: () => setActivePage('appearance') },
        { icon: <Notification size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Notifications', onTap: () => setActivePage('notifications') },
        { icon: <Category2 size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Categories', onTap: () => setActivePage('categories') },
      ],
    },
    {
      title: 'Data',
      rows: [
        { icon: <ExportSquare size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'Export data', onTap: () => setActivePage('export') },
      ],
    },
    {
      title: 'About',
      rows: [
        { icon: <InfoCircle size={20} variant="Bold" color="var(--color-text-secondary)" />, label: 'About Cent', onTap: () => setActivePage('about') },
      ],
    },
  ]

  function renderSubPage() {
    switch (activePage) {
      case 'profile': return <ProfilePage onBack={() => setActivePage(null)} />
      case 'currency': return <CurrencyPage onBack={() => setActivePage(null)} />
      case 'appearance': return <AppearancePage onBack={() => setActivePage(null)} />
      case 'notifications': return <NotificationsPage onBack={() => setActivePage(null)} />
      case 'categories': return <CategoriesPage onBack={() => setActivePage(null)} />
      case 'export': return <ExportPage onBack={() => setActivePage(null)} />
      case 'about': return <AboutPage onBack={() => setActivePage(null)} />
      default: return null
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Sheet — floating card with 8px side margins + safe-area bottom */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
      <div
        className="w-full max-w-lg bg-bg-card rounded-[36px] float-shadow"
        style={{ maxHeight: '92dvh', overflow: 'hidden' }}
      >
        {/* Settings home — scales when sub-page open */}
        <motion.div
          animate={activePage ? { scale: 0.96, y: -12 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="no-scrollbar" style={{ overflowY: 'auto', maxHeight: '92dvh' }}
          ref={sheetRef}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-[5px] pb-3">
            <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Setting2 size={22} variant="Bulk" color="currentColor" />
            <span className="text-[18px] font-semibold text-text-primary font-rounded">Settings</span>
          </div>

          {/* Sections */}
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <SectionHeader label={section.title} />
              {section.rows.map((row, ri) => (
                <div key={row.label}>
                  <Row icon={row.icon} label={row.label} onTap={row.onTap} />
                  {ri < section.rows.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          ))}

          {/* Log out */}
          <div className="px-4 mt-6 mb-2">
            {showLogoutConfirm ? (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-text-secondary font-rounded text-center">
                  Are you sure you want to log out?
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-pill text-[14px] font-semibold font-rounded text-white bg-expense"
                    onClick={() => { localStorage.clear(); window.location.reload() }}
                  >
                    Yes, log out
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-pill text-[14px] font-semibold font-rounded text-text-primary bg-bg-secondary"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3.5 rounded-pill text-[15px] font-medium font-rounded text-expense"
                style={{ border: '1px solid color-mix(in srgb, var(--color-expense) 30%, transparent)' }}
              >
                Log out
              </button>
            )}
          </div>

          {/* Version */}
          <p className="text-center text-[12px] text-text-tertiary font-rounded pt-3" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
            Version 1.0.0
          </p>
        </motion.div>

        {/* Sub-page overlay */}
        <AnimatePresence>
          {activePage && (
            <motion.div
              className="absolute inset-0 bg-bg-elevated rounded-[36px] overflow-y-auto no-scrollbar"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              {renderSubPage()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </AnimatePresence>
  )
}
