import { clampUnit, cx, type Accent } from './accent.ts'
import './ProgressBar.css'

export interface ProgressBarProps {
  /** Remplissage entre 0 et 1 (borné). */
  value: number
  /** Accent, ou `neutral` (gris) pour une option non retenue. */
  color: Accent | 'neutral'
  /** Nom accessible de la barre. */
  label: string
  /** Valeur lue par les lecteurs d'écran. Par défaut : le pourcentage. */
  valueText?: string
  /** Épaisseur : `xs` 4 px (ressources), `sm` 8 px, `md` 12 px (comparaisons). */
  thickness?: 'xs' | 'sm' | 'md'
  className?: string
}

/** Barre fine des wireframes (ressources, comparaisons d'options). */
export function ProgressBar({ value, color, label, valueText, thickness = 'xs', className }: ProgressBarProps) {
  const fraction = clampUnit(value)
  return (
    <div
      className={cx('bar', `bar--${thickness}`, `bar--${color}`, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuetext={valueText}
    >
      <div className="bar__fill" style={{ width: `${fraction * 100}%` }} />
    </div>
  )
}
