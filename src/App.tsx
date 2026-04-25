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
      <div className="flex flex-col h-[100dvh] max-w-lg mx-auto bg-bg-page overflow-hidden">
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
