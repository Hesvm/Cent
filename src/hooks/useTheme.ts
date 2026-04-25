import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'auto'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'auto'
    return (localStorage.getItem('cent_theme') as Theme) ?? 'auto'
  })

  const applyTheme = (t: Theme) => {
    const html = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (t === 'dark' || (t === 'auto' && systemDark)) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('cent_theme', theme)
  }, [theme])

  // Watch system preference changes (for auto mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'auto') applyTheme('auto')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return { theme, setTheme }
}
