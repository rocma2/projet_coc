import type { ReactNode } from 'react'
import './Toggle.css'

export interface ToggleProps {
  /** Libellé visible de la ligne, nom accessible de l'interrupteur. */
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Icône décorative avant le libellé (ex. ticket de Gold Pass). */
  icon?: ReactNode
  disabled?: boolean
}

/** Ligne avec interrupteur (questionnaire) : vraie case à cocher `role="switch"`. */
export function Toggle({ label, checked, onChange, icon, disabled }: ToggleProps) {
  return (
    <label className="toggle">
      <span className="toggle__label">
        {icon}
        {label}
      </span>
      <input
        className="toggle__input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}
