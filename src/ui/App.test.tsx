// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n/index.ts'
import { App } from './App.tsx'

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
    await i18n.changeLanguage('fr')
  })

  it("démarre sur l'import, en français, sans barre de navigation", () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Importe ton village' })).toBeInTheDocument()
    expect(screen.getByText('Étape 1 sur 3')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(document.title).toBe('Optimiseur CoC')
    expect(document.documentElement.lang).toBe('fr')
  })

  it('« Continuer » mène au questionnaire puis à Aujourd’hui', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'Continuer' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Comment tu joues ?' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Étape 2 sur 3')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/onboarding/questionnaire')

    fireEvent.click(screen.getByRole('link', { name: 'Continuer' }))
    const nav = await screen.findByRole('navigation', { name: 'Navigation principale' })
    expect(within(nav).getByRole('link', { name: "Aujourd'hui" })).toHaveAttribute('aria-current', 'page')
    expect(window.location.hash).toBe('#/today')
  })

  it("la barre du bas passe d'un onglet à l'autre et marque l'onglet courant", async () => {
    window.history.replaceState(null, '', '/#/today')
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' })
    const tabs = [
      { name: 'Plan', title: 'Plan' },
      { name: 'Inventaire', title: 'Inventaire' },
      { name: 'Sources', title: 'Sources et choix' },
      { name: "Aujourd'hui", title: null },
    ]

    for (const tab of tabs) {
      fireEvent.click(within(nav).getByRole('link', { name: tab.name }))
      if (tab.title) {
        expect(await screen.findByRole('heading', { level: 1, name: tab.title })).toBeInTheDocument()
      }
      const links = within(screen.getByRole('navigation')).getAllByRole('link')
      await expect
        .poll(() => links.filter((link) => link.getAttribute('aria-current') === 'page').map((l) => l.textContent))
        .toEqual([tab.name])
    }
    expect(screen.getByRole('link', { name: 'Réglages' })).toBeInTheDocument()
  })

  it('les réglages changent la langue, la mémorisent et mettent à jour <html lang>', async () => {
    window.history.replaceState(null, '', '/#/today')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'Réglages' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Réglages' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByText(/non affilié à Supercell/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Français' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: 'English' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked()
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '#/today')
    expect(window.localStorage.getItem('projet_coc.language')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('CoC Optimizer')

    fireEvent.click(screen.getByRole('link', { name: 'Back' }))
    const nav = await screen.findByRole('navigation', { name: 'Main navigation' })
    expect(within(nav).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  })

  it('ouvre directement un écran par son lien, et la décision hammer sans barre du bas', () => {
    window.history.replaceState(null, '', '/#/hammer')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Décision hammer' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '#/today')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('un lien inconnu retombe sur l’import', () => {
    window.history.replaceState(null, '', '/#/nimporte-quoi')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Importe ton village' })).toBeInTheDocument()
  })
})
