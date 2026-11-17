import { useId } from 'react'
import { Card } from './Card.tsx'

export interface EmptyStateProps {
  title: string
  text: string
}

/** Carte d'état vide : dit honnêtement que l'écran sera rempli plus tard. */
export function EmptyState({ title, text }: EmptyStateProps) {
  const titleId = useId()
  return (
    <Card as="section" className="empty-state" aria-labelledby={titleId}>
      <h2 id={titleId} className="empty-state__title">
        {title}
      </h2>
      <p className="empty-state__text">{text}</p>
    </Card>
  )
}
