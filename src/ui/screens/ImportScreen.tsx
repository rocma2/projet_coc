import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState.tsx'
import { LockIcon } from '../components/icons.tsx'
import { OnboardingLayout } from './OnboardingLayout.tsx'

/** Étape 1 : import de l'export JSON du jeu (wireframe Import.html). */
export function ImportScreen() {
  const { t } = useTranslation()
  return (
    <OnboardingLayout
      step={1}
      title={t('import.title')}
      lead={t('import.instructions')}
      next="onboarding/questionnaire"
    >
      <EmptyState title={t('common.laterTitle')} text={t('import.empty')} />
      <p className="note">
        <LockIcon />
        <span>{t('import.privacy')}</span>
      </p>
    </OnboardingLayout>
  )
}
