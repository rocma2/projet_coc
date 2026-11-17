import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './accent.ts'
import './PillButton.css'

interface PillBaseProps {
  /** `primary` : pilule noire ; `secondary` : pilule grise. */
  variant?: 'primary' | 'secondary'
  /** `lg` : 54 px (action de l'écran) ; `md` : 44 px (action dans une carte). */
  size?: 'lg' | 'md'
  /** Icône décorative avant le libellé. */
  icon?: ReactNode
  children: ReactNode
}

export type PillButtonProps = PillBaseProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  )

/** Bouton pilule : un vrai `<a href>` si `href` est fourni, sinon un `<button>`. */
export function PillButton(props: PillButtonProps) {
  const { variant = 'primary', size = 'lg', icon, children, className, ...rest } = props
  const classes = cx('pill', `pill--${variant}`, `pill--${size}`, className)
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  )

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    )
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button className={classes} type={type} {...buttonRest}>
      {content}
    </button>
  )
}
