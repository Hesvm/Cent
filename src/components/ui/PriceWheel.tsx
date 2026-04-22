import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import useMeasure from 'react-use-measure'

interface PriceWheelProps {
  onConfirm: (value: number) => void
  onDismiss: () => void
  initialValue?: number
  type?: 'expense' | 'income'
}

// Ruler: 20px per $1, 2px per $0.10 minor tick
const TICK_PX  = 26   // px per $1  (+30% spacing)
const MINOR_PX = 2.6  // px per $0.10  (= TICK_PX / 10)
const MAX_DOLLARS = 9999

// ── SlidingNumber ─────────────────────────────────────────────────────────────
const DIGIT_SPRING = { stiffness: 280, damping: 28, mass: 0.18 }

function DigitSlot({ value, height, blur }: { value: number; height: number; blur: number }) {
  const mv = useSpring(value, DIGIT_SPRING)

  useEffect(() => { mv.set(value) }, [mv, value])

  const y = useTransform(mv, (v) => -v * height)

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height, display: 'inline-block', minWidth: '0.6em' }}>
      <motion.div
        style={{
          y,
          position: 'absolute',
          top: 0,
          left: 0,
          filter: blur > 0 ? `blur(${blur * 0.22}px)` : undefined,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <div key={d} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {d}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function SlidingNumber({ value, blur }: { value: number; blur: number }) {
  const [ref, { height }] = useMeasure()
  const h = height || 48
  const chars = String(value).split('')
  const len = chars.length

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {/* Invisible sizer — picks up font-size from parent */}
      <div ref={ref} aria-hidden style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', userSelect: 'none' }}>
        0
      </div>
      {chars.map((ch, i) => (
        <DigitSlot
          key={len - 1 - i}   // stable key = position from right (ones, tens, …)
          value={parseInt(ch, 10)}
          height={h}
          blur={blur}
        />
      ))}
    </div>
  )
}

// ── Ruler ─────────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

interface RulerProps {
  value: number
  onChange: (v: number) => void
}

function Ruler({ value, onChange }: RulerProps) {
  const drag = useRef<{ startX: number; startValue: number } | null>(null)
  const lastValue = useRef(value)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startValue: value }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [value])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startX
    // TICK_PX px = $1, so px / TICK_PX = dollars delta
    const next = clamp(Math.round(drag.current.startValue - dx / TICK_PX), 0, MAX_DOLLARS)
    if (next !== lastValue.current) {
      lastValue.current = next
      try { navigator.vibrate(1) } catch { /* ignore */ }
      onChange(next)
    }
  }, [onChange])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    drag.current = null
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
  }, [])

  useEffect(() => { lastValue.current = value }, [value])

  // Render ticks in $0.10 (cent) units around current value
  // Each cent tick is MINOR_PX (2px) wide
  const WINDOW_CENTS = 250  // render 250 cents ($25) on each side
  const startCent = Math.max(0, value * 10 - WINDOW_CENTS)
  const endCent   = Math.min(MAX_DOLLARS * 10, value * 10 + WINDOW_CENTS)
  const ticks: number[] = []
  for (let i = startCent; i <= endCent; i++) ticks.push(i)

  return (
    <div
      className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
      style={{ height: 52, borderRadius: 100 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Center indicator */}
      <div
        className="absolute top-0 bottom-0 left-1/2 pointer-events-none z-10"
        style={{ width: 2, marginLeft: -1, background: '#1A1A1A', borderRadius: 2 }}
      />

      {/* Edge fades — use white since ruler bg is transparent */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to right, white 0%, transparent 22%, transparent 78%, white 100%)',
        }}
      />

      {/* Tick rail
          translateX(calc(50% - value*TICK_PX px)) puts dollar=0 at 50% - value*TICK_PX
          so tick at n cents = n * MINOR_PX + offset → screen pos = 50% + (n/10 - value)*TICK_PX ✓ */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translateX(calc(50% - ${value * TICK_PX}px))`,
          willChange: 'transform',
        }}
      >
        {ticks.map((n) => {
          const isMajor = n % 10 === 0   // every $1
          const isMid   = n % 5  === 0   // every $0.50
          const h     = isMajor ? 24 : isMid ? 15 : 8
          const w     = isMajor ? 2  : 1
          const color = isMajor ? '#444' : isMid ? '#ABABAB' : '#D0D0D0'
          return (
            <div
              key={n}
              style={{
                position: 'absolute',
                // n * MINOR_PX = n * 2 = absolute pixel position of this cent-tick
                left: n * MINOR_PX,
                bottom: 0,
                width: MINOR_PX,
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ width: w, height: h, background: color, borderRadius: 1 }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── PriceWheel ────────────────────────────────────────────────────────────────
export function PriceWheel({ onConfirm, onDismiss, initialValue = 0, type = 'expense' }: PriceWheelProps) {
  const [dollars, setDollars] = useState(clamp(Math.round(initialValue), 0, MAX_DOLLARS))
  const [prev, setPrev] = useState(dollars)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Lag prev by one render to compute blur while dragging
  useEffect(() => {
    setPrev(dollars)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dollars])
  const blur = editing ? 0 : Math.min(10, Math.abs(dollars - prev))

  function openEdit() {
    setInputVal(dollars === 0 ? '' : String(dollars))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function commitEdit() {
    setEditing(false)
    const parsed = parseInt(inputVal.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(parsed)) setDollars(clamp(parsed, 0, MAX_DOLLARS))
  }

  const accent = type === 'income' ? 'bg-income hover:bg-green-700' : 'bg-send hover:bg-red-600'

  return (
    <div className="bg-white rounded-3xl mx-2 mb-2 overflow-hidden animate-clarify-up float-shadow">
      {/* Amount display — tap opens number keyboard */}
      <div className="flex flex-col items-center pt-5 pb-3">
        <span className="text-[13px] text-text-secondary font-rounded mb-1">How much?</span>

        {editing ? (
          <div className="flex items-baseline gap-0.5 text-[40px] font-bold text-text-primary font-rounded tabular-nums leading-none">
            <span>$</span>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              value={inputVal}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setInputVal(raw)
                const n = parseInt(raw, 10)
                if (!isNaN(n)) setDollars(clamp(n, 0, MAX_DOLLARS))
              }}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') { commitEdit(); e.currentTarget.blur() } }}
              className="w-32 bg-transparent focus:outline-none text-center"
              style={{ fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit', lineHeight: 1 }}
            />
          </div>
        ) : (
          <button
            onClick={openEdit}
            className="flex items-center text-[40px] font-bold text-text-primary font-rounded tabular-nums leading-none active:opacity-60 transition-opacity"
          >
            <span>$</span>
            <SlidingNumber value={dollars} blur={blur} />
          </button>
        )}
      </div>

      {/* Ruler */}
      <div className="px-4 pb-4">
        <Ruler value={dollars} onChange={setDollars} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-5">
        <button
          onClick={onDismiss}
          className="flex-1 py-3 rounded-full bg-bg-page text-[15px] font-semibold text-text-secondary font-rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(dollars)}
          className={`flex-1 py-3 rounded-full text-[15px] font-semibold text-white font-rounded transition-colors ${accent}`}
        >
          Set ${dollars.toLocaleString()}
        </button>
      </div>
    </div>
  )
}
