import { AnimatePresence, motion } from 'motion/react'
import { Microphone2 } from 'iconsax-react'
import type { VoiceState } from '../../hooks/useVoiceInput'

interface VoiceButtonProps {
  state: VoiceState
  onStart: () => void
  onStop: () => void
  time: number // seconds, managed by parent
}

const PRIMARY = '#E8403A'

export function VoiceButton({ state, onStart, onStop, time }: VoiceButtonProps) {
  const listening = state === 'listening' || state === 'recording' || state === 'processing'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleClick = () => {
    if (listening) {
      onStop()
    } else {
      onStart()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className="flex p-2 items-center justify-center rounded-full cursor-pointer bg-white hover:bg-gray-50 transition-colors float-shadow text-text-secondary"
        layout
        transition={{ layout: { duration: 0.4 } }}
        onClick={handleClick}
      >
        {/* Icon — always 24×24 */}
        <div className="h-6 w-6 items-center justify-center flex flex-shrink-0">
          {listening ? (
            <motion.div
              style={{ width: 16, height: 16, background: PRIMARY, borderRadius: 2 }}
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : (
            <Microphone2 size={20} variant="Linear" color="currentColor" />
          )}
        </div>

        {/* Expanding content */}
        <AnimatePresence mode="wait">
          {listening && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden flex gap-2 items-center justify-center"
            >
              {state === 'processing' ? (
                /* Processing: spinner + text */
                <div className="flex items-center gap-2 pr-1">
                  <motion.div
                    style={{
                      width: 14, height: 14,
                      border: `2px solid ${PRIMARY}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-[12px] text-text-secondary font-rounded whitespace-nowrap">
                    Transcribing…
                  </span>
                </div>
              ) : (
                /* Listening / recording: waveform + timer */
                <>
                  {/* Waveform */}
                  <div className="flex gap-0.5 items-center justify-center">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        style={{ width: 2, background: PRIMARY, borderRadius: 2 }}
                        initial={{ height: 2 }}
                        animate={{
                          height: [2, 3 + Math.random() * 10, 3 + Math.random() * 5, 2],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.05,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                  {/* Timer */}
                  <div
                    className="text-[12px] font-rounded text-center tabular-nums"
                    style={{
                      color: (state === 'listening' && time >= 8) || (state === 'recording' && time >= 50)
                        ? '#FF6D00' : '#888888',
                      width: 36,
                    }}
                  >
                    {formatTime(time)}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
