import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { AuthSheet } from './components/ui/AuthSheet'
import { ExpenseProvider } from './context/ExpenseContext'
import { Header } from './components/layout/Header'
import { TransactionList } from './components/transactions/TransactionList'
import { InputBar } from './components/input/InputBar'
import { UndoToast } from './components/ui/UndoToast'
import { InsightsStack } from './components/insights/InsightsStack'
import { useTheme } from './hooks/useTheme'

function AppContent() {
  useTheme()

  return (
    <ExpenseProvider>
      {/* Desktop background */}
      <div className="fixed inset-0 bg-[#E8E8E8] dark:bg-[#1A1A1A] -z-10" />
      {/* Mobile shell — centered, max 390px, full height */}
      <div className="flex flex-col h-[100dvh] w-full max-w-[390px] mx-auto bg-bg-page overflow-hidden relative shadow-2xl">
        <Header />
        <InsightsStack />
        <TransactionList />
        <InputBar />
        <UndoToast />
      </div>
    </ExpenseProvider>
  )
}

export default function App() {
  return (
    <>
      <SignedIn>
        <AppContent />
      </SignedIn>
      <SignedOut>
        <AuthSheet />
      </SignedOut>
    </>
  )
}
