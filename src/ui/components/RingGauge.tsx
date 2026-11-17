import { useId, type ReactNode } from 'react'
import { clampUnit, cx, type Accent } from './accent.ts'
import './RingGauge.css'

export interface RingGaugeProps {
  /** Remplissage entre 0 et 1 (borné). */
  value: number
  color: Accent
  /** Libellé visible sous l'anneau, sert de nom accessible. */
  label: string
  /** Contenu au centre (ex. « 6/6 »), décoratif : la valeur lue vient de `valueText`. */
  children?: ReactNode
  /** Valeur lue par les lecteurs d'écran (ex. « 6 sur 6 »). Par défaut : le pourcentage. */
  valueText?: string
  /** Diamètre en pixels (84 dans les wireframes). */
  size?: number
}

const VIEWBOX = 84
const RADIUS = 35
const STROKE = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Jauge en anneau de l'accueil, exposée comme `meter` (0–100). */
export function RingGauge({ value, color, label, children, valueText, size = VIEWBOX }: RingGaugeProps) {
  const labelId = useId()
  const fraction = clampUnit(value)
  const percent = Math.round(fraction * 100)
  const center = VIEWBOX / 2

  return (
    <div className={cx('ring', `ring--${color}`)}>
      <div
        className="ring__dial"
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={valueText}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} aria-hidden="true" focusable="false">
          <circle className="ring__track" cx={center} cy={center} r={RADIUS} strokeWidth={STROKE} />
          {fraction > 0 ? (
            <circle
              className="ring__value"
              cx={center}
              cy={center}
              r={RADIUS}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null}
        </svg>
        {children !== undefined ? (
          <span className="ring__center" aria-hidden="true">
            {children}
          </span>
        ) : null}
      </div>
      <span id={labelId} className="ring__label">
        {label}
      </span>
    </div>
  )
}
