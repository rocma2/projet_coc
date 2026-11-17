import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { GearIcon } from '../components/icons.tsx'
import { IconButton } from '../components/IconButton.tsx'
import { formatToday } from '../formatDate.ts'
import { routeHref } from '../routes.ts'

/** Accueil « Aujourd'hui » (wireframe Main.html). */
export function TodayScreen() {
  const { t, i18n } = useTranslation()
  return (
    <div className="screen screen--tab screen--compact-top">
      <header className="today-header">
        <div className="today-header__text">
          <p className="today-header__eyebrow">{t('today.noVillage')}</p>
          <h1 className="today-header__title" tabIndex={-1}>
            {formatToday(new Date(), i18n.language)}
          </h1>
        </div>
        <IconButton href={routeHref('settings')} label={t('today.settings')}>
          <GearIcon />
        </IconButton>
      </header>
      <EmptyState title={t('common.laterTitle')} text={t('today.empty')} />
    </div>
  )
}
