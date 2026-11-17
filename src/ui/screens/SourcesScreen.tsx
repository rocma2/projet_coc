import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { TabScreen } from './TabScreen.tsx'

/** Valeur des sources et coût des choix (wireframe Sources.html). */
export function SourcesScreen() {
  const { t } = useTranslation()
  return (
    <TabScreen title={t('sources.title')}>
      <EmptyState title={t('common.laterTitle')} text={t('sources.empty')} />
    </TabScreen>
  )
}
