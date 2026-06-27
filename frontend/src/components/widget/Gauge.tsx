import { useId } from 'react'

interface GaugeProps {
  value: number
  min: number
  max: number
  color: string
  /** Optional second hue for a two-tone arc (e.g. blue→violet); defaults to `color`. */
  colorTo?: string
  centerLabel: string
  centerSub?: string
}

const R = 80
const CX = 100
const CY = 100
const CIRC = Math.PI * R

/** Semicircular gauge with a gradient value arc + needle. */
export function Gauge({ value, min, max, color, colorTo, centerLabel, centerSub }: GaugeProps) {
  const gid = useId().replace(/:/g, '')
  const clamped = Math.max(min, Math.min(max, value))
  const pct = (clamped - min) / (max - min)

  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  const theta = Math.PI * (1 - pct)
  const needleLen = R - 14
  const nx = CX + needleLen * Math.cos(theta)
  const ny = CY - needleLen * Math.sin(theta)

  return (
    <svg viewBox="0 0 200 118" className="w-full" role="img" aria-label={centerLabel}>
      <defs>
        {/* Sheen along the arc: translucent → solid (two-tone when colorTo is set). */}
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={colorTo ?? color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d={arcPath}
        fill="none"
        stroke="var(--surface-hover)"
        strokeWidth={12}
        strokeLinecap="round"
      />
      <path
        d={arcPath}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${pct * CIRC} ${CIRC}`}
      />
      <line
        x1={CX}
        y1={CY}
        x2={nx}
        y2={ny}
        stroke="var(--foreground)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r={4} fill="var(--foreground)" />
      <text
        x={CX}
        y={CY - 24}
        textAnchor="middle"
        className="fill-[var(--foreground)] text-[26px] font-semibold"
      >
        {centerLabel}
      </text>
      {centerSub && (
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          className="fill-[var(--muted-foreground)] text-[11px]"
        >
          {centerSub}
        </text>
      )}
    </svg>
  )
}
