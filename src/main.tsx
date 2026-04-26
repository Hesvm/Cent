import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)
const isAdmin = window.location.pathname.startsWith('/admin')

if (isAdmin) {
  import('./admin/AdminApp').then(({ default: AdminApp }) => {
    root.render(
      <StrictMode>
        <AdminApp />
      </StrictMode>,
    )
  })
} else {
  Promise.all([
    import('@clerk/clerk-react'),
    import('./App'),
  ]).then(([{ ClerkProvider }, { default: App }]) => {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

    if (!publishableKey) {
      throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
    }

    root.render(
      <StrictMode>
        <ClerkProvider publishableKey={publishableKey}>
          <App />
        </ClerkProvider>
      </StrictMode>,
    )
  })
}
