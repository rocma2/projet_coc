import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { routeHref, TAB_ROUTES, type TabRoute } from '../routes.ts'
import { InventoryTabIcon, PlanTabIcon, SourcesTabIcon, TodayTabIcon, type IconProps } from './icons.tsx'
import './BottomNav.css'

const TAB_ICONS: Record<TabRoute, ComponentType<IconProps>> = {
  today: TodayTabIcon,
  plan: PlanTabIcon,
  inventory: InventoryTabIcon,
  sources: SourcesTabIcon,
}

export interface BottomNavProps {
  /** Onglet affiché, marqué `aria-current="page"`. */
  current: TabRoute
}

/** Barre de navigation du bas : Aujourd'hui / Plan / Inventaire / Sources. */
export function BottomNav({ current }: BottomNavProps) {
  const { t } = useTranslation()
  return (
    <nav className="bottom-nav" aria-label={t('nav.label')}>
      <ul className="bottom-nav__list">
        {TAB_ROUTES.map((tab) => {
          const Icon = TAB_ICONS[tab]
          const isCurrent = tab === current
          return (
            <li key={tab}>
              <a
                className="bottom-nav__link"
                href={routeHref(tab)}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <Icon />
                <span>{t(`nav.${tab}`)}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
