import { SignIn } from '@clerk/clerk-react'

export function AuthSheet() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Dimmed backdrop */}
      <div className="flex-1 bg-black/40" />

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-3xl shadow-2xl flex flex-col items-center px-4 pt-3 pb-8 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-300 mb-6" />

        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none p-0 w-full',
              headerTitle: 'text-xl font-semibold',
              socialButtonsBlockButton: 'border border-gray-200',
              formButtonPrimary: 'bg-black hover:bg-gray-800',
            },
          }}
        />
      </div>
    </div>
  )
}
