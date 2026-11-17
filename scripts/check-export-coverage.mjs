#!/usr/bin/env node
/**
 * Vérifie qu'un export du jeu est couvert par les données de jeu (surcharges du repo comprises).
 *
 * Usage : npm run data:coverage -- <chemin/vers/export.json>
 *
 * Lecture seule : n'écrit rien. N'affiche jamais le tag du joueur (le champ n'est pas lu).
 * Réutilise le module du moteur (src/engine/game-data.ts, chargé par Node sans compilation).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { createGameData } = await import(pathToFileURL(path.join(ROOT, 'src', 'engine', 'game-data.ts')).href)

/** Section de l'export → kinds attendus. Les autres sections sont hors périmètre. */
const SECTIONS = {
  buildings: ['town-hall', 'defense', 'wall', 'storage', 'resource-collector', 'army-building', 'other-building'],
  traps: ['trap'],
  units: ['troop'],
  siege_machines: ['siege-machine'],
  heroes: ['hero'],
  spells: ['spell'],
  pets: ['pet'],
  equipment: ['hero-equipment'],
  helpers: ['helper'],
  guardians: ['guardian'],
}
/** Sections connues mais hors périmètre (base des ouvriers, boosts, horodatage, identité). */
const IGNORED = new Set(['buildings2', 'heroes2', 'traps2', 'units2', 'boosts', 'timestamp', 'tag'])

const file = process.argv[2]
if (!file) {
  console.error('Usage : npm run data:coverage -- <chemin/vers/export.json>')
  process.exit(2)
}

const exportJson = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
const dataset = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'generated', 'game-data.json'), 'utf8'))
const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'overrides.json'), 'utf8'))
const gd = createGameData(dataset, overrides)

const townHallEntity = gd.entities.find((e) => e.kind === 'town-hall')
const thItem = (exportJson.buildings ?? []).find((b) => b.data === townHallEntity?.dataId)
const th = thItem?.lvl
const src = gd.meta.source
console.log(`Données : ${src.package}@${src.version}, HDV max décrit : ${gd.meta.maxTownHall}`)
console.log(`Surcharges du repo : ${overrides.entities.length} entité(s)`)
if (!Number.isInteger(th)) {
  console.log("HDV du joueur introuvable dans l'export (buildings, data " + townHallEntity?.dataId + ')')
  process.exit(1)
}
console.log(`HDV du joueur : ${th}${th > gd.meta.maxTownHall ? ` (au-delà des données : HDV ${gd.meta.maxTownHall})` : ''}`)

const other = Object.keys(exportJson).filter((k) => !(k in SECTIONS))
const ignored = other.filter((k) => IGNORED.has(k))
const unknownSections = other.filter((k) => !IGNORED.has(k))
console.log(`Sections ignorées : ${ignored.join(', ') || '—'}`)
if (unknownSections.length) console.log(`Sections non reconnues (ignorées) : ${unknownSections.join(', ')}`)

const fmtItem = (it) =>
  `${it.data}${it.lvl != null ? ` niv. ${it.lvl}` : ''}${it.cnt != null ? ` ×${it.cnt}` : ''}${it.timer != null ? ' (en cours)' : ''}`

const problems = []
const upcomingMax = {}
const aboveKnown = []
/** Par section : exemplaires encore sous le max connu (planifiables) ou déjà au max connu. */
const plannable = {}
let totalItems = 0
let totalMatched = 0

console.log('\n== Correspondance par section ==')
for (const [section, kinds] of Object.entries(SECTIONS)) {
  const items = Array.isArray(exportJson[section]) ? exportJson[section] : []
  totalItems += items.length
  const unmatched = []
  let matched = 0
  for (const it of items) {
    const r = gd.resolve(it.data)
    if (r.status !== 'known') {
      unmatched.push(it)
      continue
    }
    matched++
    const e = r.entity
    const label = `${section} ${e.id} (${e.dataId})`
    if (!kinds.includes(e.kind)) problems.push(`${label} : kind « ${e.kind} » inattendu dans la section ${section}`)

    // Station de fabrication : défenses fabriquées et leurs modules (par ordre).
    if (Array.isArray(it.types)) {
      for (const t of it.types) {
        const c = gd.resolve(t.data)
        if (c.status !== 'known') {
          problems.push(`${label} : défense fabriquée ${t.data} inconnue`)
          continue
        }
        const modules = c.entity.modules ?? []
        ;(t.modules ?? []).forEach((m, i) => {
          const def = modules[i]
          if (!def) problems.push(`${label} → ${c.entity.id} : module n°${i + 1} (${m.data}) absent des données`)
          else if (!def.levels.some((l) => l.level === m.lvl)) {
            problems.push(`${label} → ${c.entity.id} : module « ${def.name} » niv. ${m.lvl} absent des données`)
          }
        })
      }
    }
    if (it.lvl == null) continue

    const lvl = it.lvl
    if (lvl > 0 && !e.levels.some((l) => l.level === lvl)) {
      problems.push(`${label} : niveau actuel ${lvl} absent des données (max décrit : ${e.levels.at(-1)?.level ?? 0})`)
    }
    if (it.timer != null && !e.levels.some((l) => l.level === lvl + 1)) {
      problems.push(`${label} : amélioration en cours vers le niv. ${lvl + 1}, absent des données`)
    }
    const max = gd.maxLevelAt(e, th)
    if (max.status === 'upcoming') {
      upcomingMax[e.kind] ??= new Set()
      upcomingMax[e.kind].add(e.id)
    }
    const range = gd.levelsBetween(e, lvl, max.level)
    if (range.missing.length) {
      problems.push(`${label} : niveaux ${range.missing.join(', ')} manquants jusqu'au max connu (${max.level})`)
    }
    const p = (plannable[section] ??= { below: 0, atOrAbove: 0, knownUpgrades: 0 })
    const copies = it.cnt ?? 1
    if (lvl < max.level) {
      p.below += copies
      p.knownUpgrades += copies * (max.level - lvl)
    } else p.atOrAbove += copies
    if (lvl > max.level) {
      aboveKnown.push(
        `${label} : joueur niv. ${lvl} > max connu ${max.level} pour l'HDV ${th}` +
          (e.levels.some((l) => l.level > max.level) ? ' (niveaux supérieurs présents, HDV requis inconnu)' : ''),
      )
    }
  }
  totalMatched += matched
  console.log(`${section.padEnd(15)} ${String(matched).padStart(3)} / ${String(items.length).padEnd(3)} reconnus`)
  if (unmatched.length) console.log(`  non reconnus : ${unmatched.map(fmtItem).join(' ; ')}`)
}
console.log(`${'TOTAL'.padEnd(15)} ${String(totalMatched).padStart(3)} / ${totalItems}`)

console.log('\n== Niveaux manquants (actuel, en cours, ou jusqu’au max connu) ==')
console.log(problems.length ? problems.map((p) => `  ${p}`).join('\n') : '  aucun')

console.log(`\n== Joueur au-dessus du max connu pour l'HDV ${th} ==`)
console.log(aboveKnown.length ? aboveKnown.map((p) => `  ${p}`).join('\n') : '  aucun')

console.log(`\n== Max à l'HDV ${th} « à venir » (HDV non couvert par les données) ==`)
const upcomingKinds = Object.entries(upcomingMax).sort(([a], [b]) => a.localeCompare(b))
console.log(upcomingKinds.length ? upcomingKinds.map(([k, s]) => `  ${k.padEnd(20)} ${s.size} entité(s)`).join('\n') : '  aucun')

console.log(`\n== Ce qui reste planifiable avec les données (exemplaires, cnt compris) ==`)
for (const [section, p] of Object.entries(plannable)) {
  console.log(
    `  ${section.padEnd(15)} sous le max connu : ${String(p.below).padStart(4)} (${p.knownUpgrades} amélioration(s) connue(s)) ; au max connu ou au-delà : ${p.atOrAbove}`,
  )
}

console.log(`\n== Niveaux exigeant l'HDV ${th} dans les données, par kind ==`)
const byKind = {}
for (const e of gd.entities) {
  const s = (byKind[e.kind] ??= { entities: 0, atTh: 0, maxTh: 0 })
  s.entities++
  for (const l of [...e.levels, ...(e.supercharges ?? [])]) {
    if (l.townHallRequired === th) s.atTh++
    if (l.townHallRequired != null && l.townHallRequired > s.maxTh) s.maxTh = l.townHallRequired
  }
}
for (const [k, s] of Object.entries(byKind).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(
    `  ${k.padEnd(20)} ${s.atTh > 0 ? 'oui' : 'non'} (${s.atTh} niveau(x) HDV ${th} ; HDV requis max : ${s.maxTh || '—'})`,
  )
}
