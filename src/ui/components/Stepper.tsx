import './Stepper.css'

export interface StepperProps {
  /** Étape en cours, à partir de 1. */
  current: number
  /** Nombre total d'étapes. */
  total: number
  /** Texte visible, ex. « Étape 1 sur 3 » (traduit par l'appelant). */
  label: string
}

/** En-tête d'étapes de l'onboarding : segments + « Étape n sur N ». */
export function Stepper({ current, total, label }: StepperProps) {
  const count = Math.max(1, Math.floor(total))
  return (
    <div className="stepper">
      <div className="stepper__segments" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className={index < current ? 'stepper__segment stepper__segment--done' : 'stepper__segment'} />
        ))}
      </div>
      <p className="stepper__label">{label}</p>
    </div>
  )
}
