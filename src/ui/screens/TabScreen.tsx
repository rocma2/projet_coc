import type { ReactNode } from 'react'

export interface TabScreenProps {
  title: string
  children: ReactNode
}

/** Gabarit des onglets Plan, Inventaire et Sources : grand titre puis contenu. */
export function TabScreen({ title, children }: TabScreenProps) {
  return (
    <div className="screen screen--tab">
      <h1 className="screen__title" tabIndex={-1}>
        {title}
      </h1>
      {children}
    </div>
  )
}
