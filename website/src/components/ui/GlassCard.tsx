import React from 'react'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'sm'
  children: React.ReactNode
}

export default function GlassCard({ variant = 'default', className = '', children, ...rest }: Props) {
  const cls = variant === 'gradient'
    ? 'glass-card-gradient p-6'
    : variant === 'sm'
    ? 'glass-card-sm p-4'
    : 'glass-card p-6'
  return (
    <div className={`${cls} ${className}`} {...rest}>
      {children}
    </div>
  )
}
