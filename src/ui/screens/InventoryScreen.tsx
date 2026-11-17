import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { TabScreen } from './TabScreen.tsx'

/** Inventaire et médailles (wireframe Inventaire.html). */
export function InventoryScreen() {
  const { t } = useTranslation()
  return (
    <TabScreen title={t('inventory.title')}>
      <EmptyState title={t('common.laterTitle')} text={t('inventory.empty')} />
    </TabScreen>
  )
}
