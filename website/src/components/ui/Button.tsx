import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'ghost' | 'accent'
  size?:     'sm' | 'md' | 'lg'
  accent?:   string   // hex colour for accent variant
  children:  React.ReactNode
}

const SIZE = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({
  variant = 'primary',
  size    = 'md',
  accent,
  className = '',
  children,
  ...rest
}: Props) {
  const base = `inline-flex items-center gap-2 font-medium rounded-xl
                transition-all duration-200 focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-white/50
                active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`

  const variantCls = variant === 'primary'
    ? 'bg-white text-navy-950 hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10'
    : variant === 'ghost'
    ? 'glass-card-sm text-white/70 hover:text-white hover:bg-white/10 hover:-translate-y-0.5'
    : 'text-white hover:-translate-y-0.5 hover:shadow-lg'

  const style = variant === 'accent' && accent
    ? { background: accent, boxShadow: `0 0 20px ${accent}55` }
    : {}

  return (
    <button
      className={`${base} ${SIZE[size]} ${variantCls} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </button>
  )
}
