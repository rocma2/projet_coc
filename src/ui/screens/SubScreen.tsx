import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeftIcon } from '../components/icons.tsx'
import { IconButton } from '../components/IconButton.tsx'
import { routeHref, type Route } from '../routes.ts'

export interface SubScreenProps {
  title: string
  /** Écran atteint par le bouton retour. */
  back: Route
  children: ReactNode
}

/** Gabarit des écrans secondaires (hammer, réglages) : bouton retour + titre, sans barre du bas. */
export function SubScreen({ title, back, children }: SubScreenProps) {
  const { t } = useTranslation()
  return (
    <div className="screen screen--compact-top">
      <header className="screen__bar">
        <IconButton href={routeHref(back)} label={t('common.back')}>
          <ChevronLeftIcon />
        </IconButton>
        <h1 className="screen__bar-title" tabIndex={-1}>
          {title}
        </h1>
      </header>
      {children}
    </div>
  )
}
