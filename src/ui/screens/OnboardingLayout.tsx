import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PillButton } from '../components/PillButton.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { routeHref, type Route } from '../routes.ts'

/** Nombre d'étapes annoncé par les wireframes (« Étape 1 sur 3 »). */
const ONBOARDING_STEPS = 3

export interface OnboardingLayoutProps {
  step: number
  title: string
  lead?: string
  /** Écran suivant, atteint par la pilule « Continuer ». */
  next: Route
  children: ReactNode
}

/** Gabarit commun des écrans d'onboarding : étapes, titre, contenu, « Continuer » en bas. */
export function OnboardingLayout({ step, title, lead, next, children }: OnboardingLayoutProps) {
  const { t } = useTranslation()
  return (
    <div className="screen">
      <header className="screen__header">
        <Stepper
          current={step}
          total={ONBOARDING_STEPS}
          label={t('onboarding.step', { current: step, total: ONBOARDING_STEPS })}
        />
        <h1 className="screen__title" tabIndex={-1}>
          {title}
        </h1>
        {lead ? <p className="screen__lead">{lead}</p> : null}
      </header>
      {children}
      <div className="screen__spacer" />
      <PillButton href={routeHref(next)}>{t('onboarding.continue')}</PillButton>
    </div>
  )
}
