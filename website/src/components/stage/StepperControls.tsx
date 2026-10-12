import React, { useEffect, useRef } from 'react'
import { useStepStore } from '@/store/stepStore'

interface Props {
  accent?: string
}

export default function StepperControls({ accent = '#10b981' }: Props) {
  const { stepIndex, isPlaying, speed, maxSteps, setStepIndex, setIsPlaying, setSpeed, nextStep, prevStep, reset } = useStepStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => nextStep(), 1000 / speed)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, speed, nextStep])

  const pct = maxSteps > 1 ? (stepIndex / (maxSteps - 1)) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Scrubber */}
      <div className="relative h-1.5 rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: accent }}
        />
        <input
          type="range" min={0} max={maxSteps - 1} value={stepIndex}
          onChange={(e) => { setIsPlaying(false); setStepIndex(parseInt(e.target.value)) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label="Step scrubber"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-mono">Step {stepIndex + 1} / {maxSteps}</span>
        <span className="text-xs text-white/40 font-mono">{Math.round(pct)}%</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 justify-center">
        {/* Reset */}
        <CtrlBtn onClick={reset} label="Reset" aria-label="Reset">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </CtrlBtn>
        {/* Prev */}
        <CtrlBtn onClick={prevStep} disabled={stepIndex === 0} label="Previous step">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
          </svg>
        </CtrlBtn>
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                     transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: accent, boxShadow: `0 0 16px ${accent}55` }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying
            ? <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
          }
        </button>
        {/* Next */}
        <CtrlBtn onClick={nextStep} disabled={stepIndex >= maxSteps - 1} label="Next step">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        </CtrlBtn>
        {/* Speed */}
        <div className="flex gap-1 ml-2">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all duration-150
                ${speed === s ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
              style={speed === s ? { background: accent + '30', color: accent } : {}}
              aria-label={`Speed ${s}x`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CtrlBtn({ children, label, ...rest }: { children: React.ReactNode; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="w-8 h-8 rounded-lg glass-card-sm flex items-center justify-center
                 text-white/50 hover:text-white hover:bg-white/10 transition-all
                 disabled:opacity-20 disabled:cursor-not-allowed"
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  )
}
