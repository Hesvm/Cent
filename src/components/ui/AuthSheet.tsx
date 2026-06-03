import { SignIn } from '@clerk/clerk-react'

export function AuthSheet() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Dimmed backdrop */}
      <div className="flex-1 bg-black/60" />

      {/* Bottom sheet */}
      <div className="bg-[#1F1F1F] rounded-t-3xl flex flex-col items-center px-4 pt-3 pb-8 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mb-4" />

        <SignIn routing="hash" />
      </div>
    </div>
  )
}
