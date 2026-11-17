/**
 * Icônes des wireframes, en composants React. Formes recopiées de docs/wireframes/.
 * Décoratives par défaut (`aria-hidden`) : passer `title` pour leur donner un nom accessible.
 * Les icônes « trait » suivent `currentColor` ; les illustrations du jeu utilisent la
 * palette `--icon-*` de tokens.css.
 */
import type { CSSProperties, ReactNode, SVGProps } from 'react'
import './icons.css'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Taille en pixels (largeur ; la hauteur suit le rapport de l'icône). */
  size?: number
  /** Nom accessible. Sans titre, l'icône est décorative. */
  title?: string
}

/** Style de remplissage/trait à partir de jetons `--icon-*` (ou `--color-*`). */
function paint(fill?: string, stroke?: string): CSSProperties {
  return {
    fill: fill ? `var(--${fill})` : 'none',
    ...(stroke ? { stroke: `var(--${stroke})` } : {}),
  }
}

interface SvgBaseProps extends IconProps {
  viewBox: string
  /** Rapport hauteur / largeur. */
  ratio?: number
  defaultSize: number
  children: ReactNode
}

function Svg({ size, title, viewBox, ratio = 1, defaultSize, children, ...rest }: SvgBaseProps) {
  const width = size ?? defaultSize
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true }
  return (
    <svg
      width={width}
      height={Math.round(width * ratio)}
      viewBox={viewBox}
      focusable="false"
      {...a11y}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/* ---------- Icônes trait (suivent currentColor) ---------- */

type StrokeProps = IconProps

function Stroke({ strokeWidth = 2, children, ...props }: StrokeProps & { children: ReactNode }) {
  return (
    <Svg
      viewBox="0 0 24 24"
      defaultSize={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </Svg>
  )
}

export function GearIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
    </Stroke>
  )
}

export function UploadIcon(props: StrokeProps) {
  return (
    <Stroke size={18} {...props}>
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </Stroke>
  )
}

export function CheckIcon(props: StrokeProps) {
  return (
    <Stroke size={18} strokeWidth={2.4} {...props}>
      <path d="M4 12l5 5L20 6" />
    </Stroke>
  )
}

export function LockIcon(props: StrokeProps) {
  return (
    <Stroke size={16} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Stroke>
  )
}

export function ChevronRightIcon(props: StrokeProps) {
  return (
    <Stroke size={16} strokeWidth={2.2} {...props}>
      <path d="M9 6l6 6-6 6" />
    </Stroke>
  )
}

export function ChevronLeftIcon(props: StrokeProps) {
  return (
    <Stroke size={18} strokeWidth={2.4} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Stroke>
  )
}

export function InfoIcon(props: StrokeProps) {
  return (
    <Stroke size={18} {...props}>
      <path d="M12 8v5M12 16.5v.5" />
      <circle cx="12" cy="12" r="9" />
    </Stroke>
  )
}

/* Onglets de la barre de navigation */

export function TodayTabIcon(props: StrokeProps) {
  return (
    <Stroke size={22} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Stroke>
  )
}

export function PlanTabIcon(props: StrokeProps) {
  return (
    <Stroke size={22} {...props}>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </Stroke>
  )
}

export function InventoryTabIcon(props: StrokeProps) {
  return (
    <Stroke size={22} {...props}>
      <rect x="4" y="7" width="16" height="13" rx="3" />
      <path d="M9 7V5h6v2" />
    </Stroke>
  )
}

export function SourcesTabIcon(props: StrokeProps) {
  return (
    <Stroke size={22} {...props}>
      <path d="M5 19V11M12 19V5M19 19v-6" />
    </Stroke>
  )
}

/* ---------- Illustrations du jeu ---------- */

export interface TownHallBadgeProps extends IconProps {
  /** Niveau affiché au centre du badge. */
  level?: number
}

/** Badge d'hôtel de ville avec son niveau. */
export function TownHallBadge({ level, size = 48, title, className }: TownHallBadgeProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true }
  return (
    <span
      className={['th-badge', className].filter(Boolean).join(' ')}
      style={{ width: size, height: Math.round((size * 52) / 48), fontSize: Math.round(size * 0.35) }}
      {...a11y}
    >
      <Svg viewBox="0 0 48 52" ratio={52 / 48} defaultSize={48} size={size}>
        <path d="M24 2l20 11v26L24 50 4 39V13z" style={paint('icon-th-outer', 'icon-th-stroke')} strokeWidth="2.5" />
        <path d="M24 8l15 8v20l-15 8-15-8V16z" style={paint('icon-th-inner')} />
      </Svg>
      {level !== undefined ? (
        <span className="th-badge__level" aria-hidden="true">
          {level}
        </span>
      ) : null}
    </span>
  )
}

export function BuilderHutIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 30 26" ratio={26 / 30} defaultSize={30} {...props}>
      <path d="M4 18a11 11 0 0 1 22 0z" style={paint('icon-hut', 'icon-hut-stroke')} strokeWidth="1.6" />
      <path d="M15 7v11" style={paint(undefined, 'icon-hut-stroke')} strokeWidth="1.4" />
      <rect x="2" y="18" width="26" height="4" rx="2" style={paint('icon-hut-base', 'icon-hut-stroke')} strokeWidth="1.4" />
    </Svg>
  )
}

export function GoldIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={16} {...props}>
      <circle cx="12" cy="12" r="9.5" style={paint('icon-gold', 'icon-gold-stroke')} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="5" style={paint(undefined, 'icon-gold-shine')} strokeWidth="1.6" />
    </Svg>
  )
}

const DROP = 'M12 2.5c3.2 4.6 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.5 3.3-6.9 6.5-11.5z'
const DROP_SHINE = 'M9.5 14.5a2.6 2.6 0 0 0 2.5 2.5'

export function ElixirIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={16} {...props}>
      <path d={DROP} style={paint('icon-elixir', 'icon-elixir-stroke')} strokeWidth="1.6" />
      <path d={DROP_SHINE} style={paint(undefined, 'icon-elixir-shine')} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  )
}

export function DarkElixirIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={16} {...props}>
      <path d={DROP} style={paint('icon-dark', 'icon-dark-stroke')} strokeWidth="1.6" />
      <path d={DROP_SHINE} style={paint(undefined, 'icon-dark-shine')} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  )
}

export function GemIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={16} {...props}>
      <path d="M7 3.5h10l4.5 6L12 21 2.5 9.5z" style={paint('icon-gem', 'icon-gem-stroke')} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M2.5 9.5h19M12 21L8.5 9.5 12 3.5l3.5 6z" style={paint(undefined, 'icon-gem-stroke')} strokeWidth="1.1" strokeLinejoin="round" />
    </Svg>
  )
}

const STAR_SMALL = 'M12 11l1 2.2 2.3.2-1.8 1.5.6 2.3-2.1-1.3-2.1 1.3.6-2.3-1.8-1.5 2.3-.2z'

/** Médaille de ligue (avec ruban). */
export function MedalIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={16} {...props}>
      <path d="M8 1.5l4 6 4-6" style={paint(undefined, 'icon-medal-stroke')} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="12" cy="14.5" r="7" style={paint('icon-medal', 'icon-medal-stroke')} strokeWidth="1.8" />
      <path d={STAR_SMALL} style={paint('icon-medal-star')} />
    </Svg>
  )
}

/** Médaille d'event (hexagone étoilé). */
export function EventMedalIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={24} {...props}>
      <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" style={paint('icon-event', 'icon-event-stroke')} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 7.5l1.3 2.7 3 .4-2.2 2 .6 2.9-2.7-1.5-2.7 1.5.6-2.9-2.2-2 3-.4z" style={paint('icon-event-star')} />
    </Svg>
  )
}

export type PassKind = 'gold' | 'event'

/** Ticket de pass (Gold Pass ou Event Pass). */
export function PassIcon({ kind = 'gold', ...props }: IconProps & { kind?: PassKind }) {
  const fill = kind === 'gold' ? paint('icon-gold', 'icon-hut-stroke') : paint('icon-event', 'icon-event-stroke')
  const star = kind === 'gold' ? paint('icon-pass-star') : paint('icon-event-star')
  return (
    <Svg viewBox="0 0 24 24" defaultSize={22} {...props}>
      <path
        d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5z"
        style={fill}
        strokeWidth="1.5"
      />
      <path d="M12 8.5l1.1 2.3 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z" style={star} />
    </Svg>
  )
}

/** Trophée (Ligue Légende). */
export function TrophyIcon(props: IconProps) {
  const style = paint('icon-trophy', 'icon-trophy-stroke')
  return (
    <Svg viewBox="0 0 24 24" defaultSize={22} {...props}>
      <path d="M7 3h10v5a5 5 0 0 1-10 0z" style={style} strokeWidth="1.5" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" style={paint(undefined, 'icon-trophy-stroke')} strokeWidth="1.5" />
      <path d="M12 13v4M8 21h8l-1-4H9z" style={style} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  )
}

export type HammerKind = 'building' | 'fighting' | 'spells' | 'heroes'

export function HammerIcon({ kind = 'building', ...props }: IconProps & { kind?: HammerKind }) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={24} {...props}>
      <rect
        x="3"
        y="3"
        width="13"
        height="7"
        rx="1.5"
        transform="rotate(-45 9.5 6.5)"
        style={paint(`icon-hammer-${kind}`, `icon-hammer-${kind}-stroke`)}
        strokeWidth="1.2"
      />
      <path d="M12 11l8.5 8.5" style={paint(undefined, 'icon-hammer-handle')} strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  )
}

export type PotionKind = 'builder' | 'research'

/** Flacon : potion d'ouvrier (or) ou de recherche / laboratoire (rose). */
export function PotionIcon({ kind = 'builder', ...props }: IconProps & { kind?: PotionKind }) {
  const style = kind === 'builder' ? paint('icon-gold', 'icon-hut-stroke') : paint('icon-elixir', 'icon-elixir-stroke')
  return (
    <Svg viewBox="0 0 24 24" defaultSize={22} {...props}>
      <path
        d="M9.5 2.5h5M10 2.5v5.5l-4.5 7.5a4 4 0 0 0 3.4 6h6.2a4 4 0 0 0 3.4-6L14 8V2.5"
        style={style}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function BookIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" defaultSize={22} {...props}>
      <rect x="4" y="3" width="15" height="18" rx="2" style={paint('icon-book', 'icon-book-stroke')} strokeWidth="1.5" />
      <path d="M8 3v18" style={paint(undefined, 'icon-book-stroke')} strokeWidth="1.5" />
      <path d="M11 9h5M11 12h4" style={paint(undefined, 'icon-book-lines')} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}
