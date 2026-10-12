import React, { useState } from 'react'

interface Tab {
  key:   string
  label: string
}

interface Props {
  tabs:     Tab[]
  defaultTab?: string
  onChange?: (key: string) => void
  children: (activeKey: string) => React.ReactNode
}

export default function Tabs({ tabs, defaultTab, onChange, children }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? '')

  const select = (key: string) => {
    setActive(key)
    onChange?.(key)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-1 glass-card-sm rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => select(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${active === t.key
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {children(active)}
    </div>
  )
}
