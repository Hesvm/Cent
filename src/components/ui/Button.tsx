import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'icon'
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center transition-colors focus:outline-none'
  const variants = {
    primary: 'bg-send text-white rounded-pill px-4 py-1.5 text-[12px] font-medium hover:bg-red-600',
    ghost: 'text-text-secondary hover:text-text-primary',
    icon: 'rounded-full bg-white border border-border hover:bg-gray-50',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
