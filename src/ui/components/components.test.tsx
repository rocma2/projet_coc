// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './IconButton.tsx'
import { PillButton } from './PillButton.tsx'
import { QuantityStepper } from './QuantityStepper.tsx'
import { RingGauge } from './RingGauge.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'
import { Toggle } from './Toggle.tsx'

describe('RingGauge', () => {
  it('expose un nom et une valeur accessibles', () => {
    render(
      <RingGauge value={0.62} color="green" label="Défenses maxées" valueText="62 %">
        62 %
      </RingGauge>,
    )
    const meter = screen.getByRole('meter', { name: 'Défenses maxées' })
    expect(meter).toHaveAttribute('aria-valuenow', '62')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(meter).toHaveAttribute('aria-valuetext', '62 %')
  })

  it('borne la valeur entre 0 et 1', () => {
    const { rerender } = render(<RingGauge value={1.7} color="blue" label="Médailles" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
    rerender(<RingGauge value={-0.3} color="blue" label="Médailles" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0')
    rerender(<RingGauge value={Number.NaN} color="blue" label="Médailles" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0')
  })
})

function StepperHarness({ initial, min, max }: { initial: number; min: number; max: number }) {
  const [value, setValue] = useState(initial)
  return (
    <QuantityStepper
      value={value}
      min={min}
      max={max}
      onChange={setValue}
      decrementLabel="Retirer un constructeur"
      incrementLabel="Ajouter un constructeur"
      valueLabel="Constructeurs"
    />
  )
}

describe('QuantityStepper', () => {
  it('respecte le minimum et le maximum', () => {
    render(<StepperHarness initial={5} min={2} max={6} />)
    const minus = screen.getByRole('button', { name: 'Retirer un constructeur' })
    const plus = screen.getByRole('button', { name: 'Ajouter un constructeur' })
    const value = screen.getByRole('status', { name: 'Constructeurs' })

    fireEvent.click(plus)
    expect(value).toHaveTextContent('6')
    expect(plus).toBeDisabled()
    fireEvent.click(plus)
    expect(value).toHaveTextContent('6')

    fireEvent.click(minus)
    fireEvent.click(minus)
    fireEvent.click(minus)
    fireEvent.click(minus)
    expect(value).toHaveTextContent('2')
    expect(minus).toBeDisabled()
    expect(plus).toBeEnabled()
  })

  it('affiche le texte fourni et ne propose jamais une valeur hors bornes', () => {
    const onChange = vi.fn()
    render(
      <QuantityStepper
        value={4}
        min={0}
        max={5}
        step={3}
        onChange={onChange}
        decrementLabel="Retirer une potion"
        incrementLabel="Ajouter une potion"
        display="4/5"
        size="sm"
      />,
    )
    expect(screen.getByText('4/5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une potion' }))
    expect(onChange).toHaveBeenLastCalledWith(5)
    fireEvent.click(screen.getByRole('button', { name: 'Retirer une potion' }))
    expect(onChange).toHaveBeenLastCalledWith(1)
  })
})

describe('Toggle', () => {
  it('est un interrupteur nommé par son libellé', () => {
    function Harness() {
      const [on, setOn] = useState(false)
      return <Toggle label="Gold Pass" checked={on} onChange={setOn} />
    }
    render(<Harness />)
    const toggle = screen.getByRole('switch', { name: 'Gold Pass' })
    expect(toggle).not.toBeChecked()
    fireEvent.click(toggle)
    expect(toggle).toBeChecked()
    fireEvent.click(screen.getByText('Gold Pass'))
    expect(toggle).not.toBeChecked()
  })
})

describe('SegmentedControl', () => {
  it('est un groupe radio exclusif', () => {
    const options = [
      { value: 'all', label: "Tous d'un coup" },
      { value: 'two', label: 'Deux à la fois' },
      { value: 'useful', label: "Utiles d'abord" },
    ] as const
    function Harness() {
      const [value, setValue] = useState<(typeof options)[number]['value']>('two')
      return <SegmentedControl label="Héros" options={options} value={value} onChange={setValue} />
    }
    render(<Harness />)

    expect(screen.getByRole('radiogroup', { name: 'Héros' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Deux à la fois' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: "Utiles d'abord" }))
    expect(screen.getByRole('radio', { name: "Utiles d'abord" })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Deux à la fois' })).not.toBeChecked()
  })
})

describe('PillButton et IconButton', () => {
  it('rendent un lien avec href, sinon un bouton', () => {
    render(
      <>
        <PillButton href="#/today">Continuer</PillButton>
        <PillButton variant="secondary" onClick={() => {}}>
          Choisir un fichier
        </PillButton>
        <IconButton label="Réglages" href="#/settings">
          <svg aria-hidden="true" />
        </IconButton>
        <IconButton label="Fermer" onClick={() => {}}>
          <svg aria-hidden="true" />
        </IconButton>
      </>,
    )
    expect(screen.getByRole('link', { name: 'Continuer' })).toHaveAttribute('href', '#/today')
    expect(screen.getByRole('button', { name: 'Choisir un fichier' })).toHaveAttribute('type', 'button')
    expect(screen.getByRole('link', { name: 'Réglages' })).toHaveAttribute('href', '#/settings')
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument()
  })
})
