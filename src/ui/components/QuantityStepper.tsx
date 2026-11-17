import { cx } from './accent.ts'
import './QuantityStepper.css'

export interface QuantityStepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** Nom accessible du bouton « − » (ex. « Retirer un constructeur »). */
  decrementLabel: string
  /** Nom accessible du bouton « + » (ex. « Ajouter un constructeur »). */
  incrementLabel: string
  /** Nom accessible de la valeur affichée (ex. « Constructeurs »). */
  valueLabel?: string
  /** Texte affiché au centre ; par défaut la valeur (ex. « 4/5 » pour un stock). */
  display?: string
  /** `md` : boutons de 36 px (constructeurs) ; `sm` : 28 px (lignes d'inventaire). Cible tactile 44 px dans les deux cas. */
  size?: 'md' | 'sm'
  step?: number
}

/** Compteur − valeur + borné par `min` et `max`. */
export function QuantityStepper({
  value,
  min,
  max,
  onChange,
  decrementLabel,
  incrementLabel,
  valueLabel,
  display,
  size = 'md',
  step = 1,
}: QuantityStepperProps) {
  const canDecrement = value > min
  const canIncrement = value < max
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)))

  return (
    <div className={cx('qty', `qty--${size}`)}>
      <button
        type="button"
        className="qty__button"
        aria-label={decrementLabel}
        disabled={!canDecrement}
        onClick={() => set(value - step)}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output className="qty__value" aria-live="polite" aria-label={valueLabel}>
        {display ?? value}
      </output>
      <button
        type="button"
        className="qty__button"
        aria-label={incrementLabel}
        disabled={!canIncrement}
        onClick={() => set(value + step)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
