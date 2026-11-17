import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { TabScreen } from './TabScreen.tsx'

/** Plan de la semaine (wireframe Plan.html). */
export function PlanScreen() {
  const { t } = useTranslation()
  return (
    <TabScreen title={t('plan.title')}>
      <EmptyState title={t('common.laterTitle')} text={t('plan.empty')} />
    </TabScreen>
  )
}
