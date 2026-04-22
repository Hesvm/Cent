import { useRef, useState, useCallback, useEffect } from 'react'

interface PriceWheelProps {
  onConfirm: (value: number) => void
  onDismiss: () => void
  initialValue?: number
  type?: 'expense' | 'income'
}

// Horizontal ruler — each tick = $1, major tick every 5, labelled every 10
const TICK_PX = 8
const MAX_DOLLARS = 9999
const CENTS = [0, 25, 50, 75, 99]

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

interface RulerProps {
  value: number
  onChange: (v: number) => void
}

function Ruler({ value, onChange }: RulerProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startX: number; startValue: number } | null>(null)
  const lastValue = useRef(value)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startValue: value }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [value])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startX
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

  // Render a window of ticks around the current value for performance
  const WINDOW = 60
  const start = Math.max(0, value - WINDOW)
  const end = Math.min(MAX_DOLLARS, value + WINDOW)
  const ticks: number[] = []
  for (let i = start; i <= end; i++) ticks.push(i)

  return (
    <div
      ref={trackRef}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
      style={{ height: 56 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Center indicator */}
      <div
        className="absolute left-1/2 top-0 bottom-0 pointer-events-none z-10"
        style={{ width: 2, marginLeft: -1, background: '#1A1A1A', borderRadius: 1 }}
      />

      {/* Fades */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to right, #fff 0%, transparent 20%, transparent 80%, #fff 100%)' }}
      />

      {/* Tick rail */}
      <div
        className="absolute top-0 bottom-0 flex items-end"
        style={{
          left: '50%',
          transform: `translateX(${-value * TICK_PX}px)`,
          willChange: 'transform',
        }}
      >
        {ticks.map((n) => {
          const isMajor = n % 10 === 0
          const isMid = n % 5 === 0
          const h = isMajor ? 24 : isMid ? 16 : 10
          return (
            <div
              key={n}
              className="flex flex-col items-center justify-end"
              style={{ width: TICK_PX, position: 'absolute', left: (n - start) * TICK_PX, bottom: 0, top: 0 }}
            >
              <div style={{ width: 1, height: h, background: isMajor ? '#1A1A1A' : '#C0C0C0', marginTop: 'auto' }} />
              {isMajor && (
                <span className="text-[10px] text-text-secondary font-rounded" style={{ position: 'absolute', top: 0 }}>
                  {n}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PriceWheel({ onConfirm, onDismiss, initialValue = 0, type = 'expense' }: PriceWheelProps) {
  const initInt = Math.floor(initialValue)
  const initCents = Math.round((initialValue - initInt) * 100)
  const [dollars, setDollars] = useState(clamp(initInt, 0, MAX_DOLLARS))
  const [cents, setCents] = useState(CENTS.includes(initCents) ? initCents : 0)

  const value = dollars + cents / 100
  const accent = type === 'income' ? 'bg-income hover:bg-green-700' : 'bg-send hover:bg-red-600'

  return (
    <div className="bg-white rounded-2xl mx-2 mb-2 overflow-hidden animate-clarify-up float-shadow">
      {/* Amount display */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="text-[14px] text-text-secondary font-rounded">How much?</span>
        <span className="text-[28px] font-bold text-text-primary font-rounded tabular-nums">
          ${dollars.toLocaleString()}.{String(cents).padStart(2, '0')}
        </span>
      </div>

      {/* Horizontal ruler */}
      <div className="px-2">
        <Ruler value={dollars} onChange={setDollars} />
      </div>

      {/* Cents chips */}
      <div className="flex gap-2 px-4 pt-2 pb-3 justify-center">
        {CENTS.map((c) => (
          <button
            key={c}
            onClick={() => setCents(c)}
            className={`text-[12px] font-semibold rounded-pill px-3 py-1 font-rounded transition-colors ${
              cents === c ? 'bg-text-primary text-white' : 'bg-[#F0EEE8] text-text-secondary hover:bg-[#E8E6E0]'
            }`}
          >
            .{String(c).padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={onDismiss}
          className="flex-1 py-3 rounded-xl bg-[#F0EEE8] text-[15px] font-semibold text-text-secondary font-rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(value)}
          className={`flex-1 py-3 rounded-xl text-[15px] font-semibold text-white font-rounded transition-colors ${accent}`}
        >
          Set ${dollars.toLocaleString()}.{String(cents).padStart(2, '0')}
        </button>
      </div>
    </div>
  )
}
