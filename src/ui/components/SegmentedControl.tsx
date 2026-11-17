import { useId } from 'react'
import './SegmentedControl.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Langue du libellé, si elle diffère de la page (ex. « English »). */
  lang?: string
}

export interface SegmentedControlProps<T extends string> {
  /** Nom accessible du groupe. */
  label: string
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Nom du groupe de boutons radio (généré par défaut). */
  name?: string
}

/**
 * Choix exclusif en pilules (ex. héros du questionnaire). Vrais boutons radio :
 * le clavier (flèches) fonctionne nativement.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, name }: SegmentedControlProps<T>) {
  const generatedName = useId()
  const groupName = name ?? generatedName
  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <label key={option.value} className="segmented__option" lang={option.lang}>
          <input
            className="segmented__input"
            type="radio"
            name={groupName}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span className="segmented__text">{option.label}</span>
        </label>
      ))}
    </div>
  )
}
