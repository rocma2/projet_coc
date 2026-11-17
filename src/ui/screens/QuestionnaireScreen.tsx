import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { OnboardingLayout } from './OnboardingLayout.tsx'

/** Étape 2 : questionnaire de départ (wireframe Questionnaire.html). */
export function QuestionnaireScreen() {
  const { t } = useTranslation()
  return (
    <OnboardingLayout step={2} title={t('questionnaire.title')} next="today">
      <EmptyState title={t('common.laterTitle')} text={t('questionnaire.empty')} />
    </OnboardingLayout>
  )
}
