// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n/index.ts'
import { App } from './App.tsx'

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('fr')
  })

  it('affiche le titre en français puis en anglais après le changement de langue', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Optimiseur CoC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'CoC Optimizer' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('projet_coc.language')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
