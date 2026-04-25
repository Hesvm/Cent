import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { AuthSheet } from './components/ui/AuthSheet'
import { MockExpenseProvider } from './context/MockExpenseContext'
import { Header } from './components/layout/Header'
import { TransactionList } from './components/transactions/TransactionList'
import { InputBar } from './components/input/InputBar'
import { UndoToast } from './components/ui/UndoToast'

export default function App() {
  return (
    <>
      <SignedIn>
        <MockExpenseProvider>
          <div className="flex flex-col h-[100dvh] max-w-lg mx-auto bg-bg-page overflow-hidden">
            <Header />
            <TransactionList />
            <InputBar />
            <UndoToast />
          </div>
        </MockExpenseProvider>
      </SignedIn>
      <SignedOut>
        <AuthSheet />
      </SignedOut>
    </>
  )
}
