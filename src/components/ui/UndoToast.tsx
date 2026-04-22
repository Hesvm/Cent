import { useEffect, useState } from 'react'
import { useExpense } from '../../context/MockExpenseContext'

export function UndoToast() {
  const { pendingDeletion, undoDelete } = useExpense()
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!pendingDeletion) return
    function tick() {
      const ms = Math.max(0, (pendingDeletion?.expiresAt ?? 0) - Date.now())
      setRemaining(Math.ceil(ms / 1000))
    }
    tick()
    const interval = window.setInterval(tick, 200)
    return () => window.clearInterval(interval)
  }, [pendingDeletion])

  if (!pendingDeletion) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-clarify-up">
      <div className="bg-text-primary text-white rounded-pill flex items-center gap-3 pl-4 pr-1 py-1 float-shadow">
        <span className="text-[13px] font-rounded">
          Deleted "{pendingDeletion.transaction.name}"
        </span>
        <button
          onClick={undoDelete}
          className="bg-white/15 hover:bg-white/25 text-white text-[12px] font-semibold rounded-pill px-3 py-1.5 font-rounded transition-colors"
        >
          Undo {remaining > 0 ? `(${remaining})` : ''}
        </button>
      </div>
    </div>
  )
}
