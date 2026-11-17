import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './accent.ts'
import './Card.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Élément rendu ; `section` demande un titre (`aria-labelledby`). */
  as?: 'div' | 'section' | 'article'
  /** `default` : 16 px de marge ; `list` : lignes séparées par des filets (4 px × 16 px). */
  variant?: 'default' | 'list'
  /** Rayon : `lg` 24 px (cartes principales), `md` 20 px (petites cartes). */
  radius?: 'lg' | 'md'
  children: ReactNode
}

/** Carte blanche arrondie des wireframes. */
export function Card({
  as: Element = 'div',
  variant = 'default',
  radius = 'lg',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Element className={cx('card', `card--${variant}`, `card--radius-${radius}`, className)} {...rest}>
      {children}
    </Element>
  )
}
