import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { SubScreen } from './SubScreen.tsx'

/** Décision hammer : attendre ou utiliser maintenant (wireframe Hammer.html). */
export function HammerScreen() {
  const { t } = useTranslation()
  return (
    <SubScreen title={t('hammer.title')} back="today">
      <EmptyState title={t('common.laterTitle')} text={t('hammer.empty')} />
    </SubScreen>
  )
}
