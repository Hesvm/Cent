import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.tsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#F0F0F0',
          colorBackground: '#1F1F1F',
          colorInputBackground: '#171717',
          colorInputText: '#F0F0F0',
          colorText: '#F0F0F0',
          colorTextSecondary: '#909090',
          colorBorder: 'rgba(255,255,255,0.08)',
          borderRadius: '18px',
        },
        elements: {
          rootBox: 'w-full flex justify-center',
          card: 'shadow-none border border-white/8',
          socialButtonsBlockButton: 'bg-[#282828] border-white/8 text-[#F0F0F0] hover:bg-[#2E2E2E]',
          formFieldInput: 'bg-[#171717] border-white/8 text-[#F0F0F0]',
          formButtonPrimary: 'bg-[#F0F0F0] text-[#111111] hover:bg-white',
          footerActionText: 'text-[#909090]',
          footerActionLink: 'text-[#F0F0F0]',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
