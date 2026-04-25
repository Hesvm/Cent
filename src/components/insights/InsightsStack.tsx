import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react'
import { useExpense } from '../../context/ExpenseContext'
import type { Insight } from '../../types'

// ─── Inner card content ───────────────────────────────────────────────────────

function InsightCardContent({ insight, onDismiss }: { insight: Insight; onDismiss?: () => void }) {
  return (
    <div
      className="bg-bg-card rounded-2xl px-5 py-4 flex items-start gap-3 min-h-[72px] border border-[var(--color-border)]"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Emoji */}
      <span className="text-[26px] leading-none flex-shrink-0 mt-0.5">{insight.emoji}</span>

      {/* Message */}
      <p
        className="flex-1 text-[14px] text-text-primary leading-[1.5] font-rounded"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {insight.message}
      </p>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-text-hint hover:text-text-secondary transition-colors"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Swipeable top card ───────────────────────────────────────────────────────

function SwipeableCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-6, 0, 6])
  const opacity = useTransform(x, [-200, 0, 200], [0.6, 1, 0.6])

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    const threshold = window.innerWidth * 0.3
    if (Math.abs(info.offset.x) > threshold) {
      // Complete dismiss: animate out then call onDismiss
      void animate(x, info.offset.x > 0 ? 600 : -600, {
        duration: 0.3,
        ease: 'easeIn',
      }).then(onDismiss)
    } else {
      // Snap back
      void animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className="cursor-grab active:cursor-grabbing"
    >
      <InsightCardContent insight={insight} onDismiss={onDismiss} />
    </motion.div>
  )
}

// ─── Stack container ──────────────────────────────────────────────────────────

export function InsightsStack() {
  const { activeInsights, dismissInsight } = useExpense()
  const containerRef = useRef<HTMLDivElement>(null)

  if (activeInsights.length === 0) return null

  const [card1, card2, card3] = activeInsights

  return (
    <div ref={containerRef} className="px-4 pt-4 pb-2">
      <div className="relative" style={{ paddingBottom: card2 ? (card3 ? 20 : 12) : 0 }}>

        {/* Card 3 — furthest back, not interactive */}
        {card3 && (
          <div
            className="absolute inset-x-0"
            style={{
              top: 12,
              transform: 'scale(0.90)',
              transformOrigin: 'top center',
              opacity: 0.4,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <InsightCardContent insight={card3} />
          </div>
        )}

        {/* Card 2 — behind, not interactive */}
        {card2 && (
          <div
            className="absolute inset-x-0"
            style={{
              top: 6,
              transform: 'scale(0.95)',
              transformOrigin: 'top center',
              opacity: 0.7,
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            <InsightCardContent insight={card2} />
          </div>
        )}

        {/* Card 1 — top, interactive */}
        <AnimatePresence mode="popLayout">
          {card1 && (
            <motion.div
              key={card1.id}
              style={{ position: 'relative', zIndex: 30 }}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              <SwipeableCard
                insight={card1}
                onDismiss={() => dismissInsight(card1.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
