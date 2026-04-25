import { useEffect, useRef, useState } from 'react'

interface AboutSheetProps {
  onClose: () => void
}

export function AboutSheet({ onClose }: AboutSheetProps) {
  const [isClosing, setIsClosing] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  function close() {
    setIsClosing(true)
    setTimeout(onClose, 250)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === backdropRef.current) close() }}
    >
      {/* Floating card wrapper — 8px side margins, safe-area bottom */}
      <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div
          className={`bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grabber */}
          <div className="flex justify-center pt-[5px] pb-3">
            <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
          </div>

          <div className="px-6 pb-8">
            {/* Logo + name */}
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-[22px] overflow-hidden float-shadow">
                <img src="/cent-logo.svg" alt="Cent" className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <p className="text-[22px] font-bold text-text-primary font-rounded">Cent</p>
                <p className="text-[13px] text-text-secondary font-rounded mt-0.5">Version 0.1.0 · Beta</p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-center text-[15px] text-text-secondary font-rounded mb-6 leading-relaxed">
              A minimal expense tracker that listens.<br />
              Type or speak — Cent figures out the rest.
            </p>

            {/* Info rows */}
            <div className="space-y-2">
              <InfoRow label="Made by" value="Hesam" />
              <InfoRow label="Built with" value="React · TypeScript · Gemini" />
              <InfoRow label="Design" value="SF Pro Rounded · Thiings.co" />
              <InfoRow label="Status" value="Early access" dot="green" />
            </div>

            <p className="text-center text-[12px] text-text-hint font-rounded mt-8">
              © 2026 Cent. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="rounded-xl bg-[#F8F8F8] px-4 py-3 flex items-center justify-between">
      <span className="text-[14px] text-text-secondary font-rounded">{label}</span>
      <div className="flex items-center gap-1.5">
        {dot === 'green' && (
          <span className="w-2 h-2 rounded-full bg-income inline-block" />
        )}
        <span className="text-[14px] font-medium text-text-primary font-rounded">{value}</span>
      </div>
    </div>
  )
}
