import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './accent.ts'
import './IconButton.css'

interface IconButtonBaseProps {
  /** Nom accessible, obligatoire : le bouton n'a pas de texte visible. */
  label: string
  /** Icône (décorative). */
  children: ReactNode
}

export type IconButtonProps = IconButtonBaseProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'aria-label' | 'children'>)
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>)
  )

/** Bouton rond de 44 px (réglages, retour). Lien si `href` est fourni. */
export function IconButton(props: IconButtonProps) {
  const { label, children, className, ...rest } = props
  const classes = cx('icon-button', className)

  if (rest.href !== undefined) {
    return (
      <a className={classes} aria-label={label} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button className={classes} type={type} aria-label={label} {...buttonRest}>
      {children}
    </button>
  )
}
