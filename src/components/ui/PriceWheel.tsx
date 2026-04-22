import { useRef, useState, useCallback, useEffect } from 'react'

interface PriceWheelProps {
  onConfirm: (value: number) => void
  onDismiss: () => void
  initialValue?: number
  type?: 'expense' | 'income'
}

const TICK_PX = 10       // px per $1 tick
const MAX_DOLLARS = 9999

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

  const WINDOW = 50
  const start = Math.max(0, value - WINDOW)
  const end = Math.min(MAX_DOLLARS, value + WINDOW)
  const ticks: number[] = []
  for (let i = start; i <= end; i++) ticks.push(i)

  return (
    // Pill-shaped track container
    <div
      className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
      style={{
        height: 52,
        borderRadius: 100,
        background: '#F5F4F0',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Center indicator line */}
      <div
        className="absolute top-0 bottom-0 left-1/2 pointer-events-none z-10"
        style={{ width: 2, marginLeft: -1, background: '#1A1A1A', borderRadius: 2 }}
      />

      {/* Side fades */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to right, #F5F4F0 0%, transparent 18%, transparent 82%, #F5F4F0 100%)',
        }}
      />

      {/* Tick rail — anchored at center, translates left as value grows */}
      <div
        className="absolute inset-0 flex items-end pb-3"
        style={{
          left: '50%',
          transform: `translateX(${-value * TICK_PX}px)`,
          willChange: 'transform',
        }}
      >
        {ticks.map((n) => {
          const isMajor = n % 10 === 0
          const isMid = n % 5 === 0
          const h = isMajor ? 20 : isMid ? 13 : 8
          const w = isMajor ? 2 : 1
          const color = isMajor ? '#555' : '#BBBBB'
          return (
            <div
              key={n}
              style={{
                position: 'absolute',
                left: (n - start) * TICK_PX,
                bottom: 0,
                width: TICK_PX,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: '100%',
                paddingBottom: 10,
              }}
            >
              <div
                style={{
                  width: w,
                  height: h,
                  background: color,
                  borderRadius: 2,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PriceWheel({ onConfirm, onDismiss, initialValue = 0, type = 'expense' }: PriceWheelProps) {
  const [dollars, setDollars] = useState(clamp(Math.round(initialValue), 0, MAX_DOLLARS))

  const accent = type === 'income' ? 'bg-income hover:bg-green-700' : 'bg-send hover:bg-red-600'

  return (
    <div className="bg-white rounded-3xl mx-2 mb-2 overflow-hidden animate-clarify-up float-shadow">
      {/* Centered amount display */}
      <div className="flex flex-col items-center pt-5 pb-3">
        <span className="text-[13px] text-text-secondary font-rounded mb-1">How much?</span>
        <span className="text-[40px] font-bold text-text-primary font-rounded tabular-nums leading-none">
          ${dollars.toLocaleString()}
        </span>
      </div>

      {/* Horizontal ruler */}
      <div className="px-4 pb-4">
        <Ruler value={dollars} onChange={setDollars} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-5">
        <button
          onClick={onDismiss}
          className="flex-1 py-3 rounded-full bg-[#F0EEE8] text-[15px] font-semibold text-text-secondary font-rounded"
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
