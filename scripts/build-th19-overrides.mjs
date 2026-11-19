// Usage: node scripts/build-th19-overrides.mjs src/data/generated/game-data.json <export.json> src/data/overrides.json
// Builds src/data/overrides.json from values read in the game's builder menu on 2026-11-19.
// Displayed values include the Gold Pass reduction (-20 % on cost and time). Base values are
// displayed / 0.8; times are shown truncated to the hour, so the base time is the unique
// "round" value (whole hour, preferring a multiple of 12 h) whose discounted value displays
// as observed. The script refuses any value that does not resolve cleanly.
import fs from 'node:fs'

const [datasetPath, exportPath, outPath] = process.argv.slice(2)
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
const exp = JSON.parse(fs.readFileSync(exportPath, 'utf8'))

const H = 3600
const D = 24 * H
const d = (days, hours = 0) => days * D + hours * H

// name, dataId (null = look up by name), target level, displayed cost, resource, displayed time (s)
const observed = [
  ['Firecracker Tower', 1000108, 2, 25_600_000, 'gold', d(12)],
  ['Hero Hall', null, 13, 24_400_000, 'elixir', d(12, 9)],
  ['Multi-Archer Tower', null, 5, 23_200_000, 'gold', d(11, 14)],
  ['Air Defense', null, 17, 22_800_000, 'gold', d(11, 4)],
  ['Ricochet Cannon', null, 5, 22_400_000, 'gold', d(11, 4)],
  ['X-Bow', null, 14, 22_400_000, 'gold', d(11, 4)],
  ['Hidden Tesla', null, 18, 22_000_000, 'gold', d(11, 4)],
  ["Builder's Hut", null, 9, 20_800_000, 'gold', d(11, 4)],
  ['Dark Elixir Storage', null, 14, 19_200_000, 'elixir', d(10, 9)],
  ['Smasher', null, 6, 19_200_000, 'elixir', d(9, 14)],
  ['Spell Factory', null, 10, 14_800_000, 'elixir', d(8, 9)],
  ['Gold Storage', null, 20, 14_400_000, 'elixir', d(8, 19)],
  ['Elixir Storage', null, 20, 14_400_000, 'gold', d(8, 19)],
  ['Skeleton Trap', null, 6, 14_400_000, 'gold', d(7, 4)],
  ['Air Bomb', null, 14, 14_000_000, 'gold', d(6, 19)],
  ['Spring Trap', null, 14, 13_600_000, 'gold', d(6, 9)],
  ['Dark Elixir Drill', null, 12, 10_000_000, 'elixir', d(5, 4)],
  ['Wall', null, 20, 8_000_000, 'gold-or-elixir', 0],
  ['Gold Mine', null, 18, 6_800_000, 'elixir', d(2, 9)],
  ['Elixir Collector', null, 18, 6_800_000, 'gold', d(2, 9)],
  ['Squad Barracks', 1000106, 2, 2_400_000, 'elixir', d(2, 9)],
]

// New Town Hall 19 entities, unknown to the dataset (ids from the export, names from the game).
const added = {
  1000105: { id: 'guardian-shrine', name: 'Guardian Shrine', kind: 'other-building' },
  1000106: { id: 'squad-barracks', name: 'Squad Barracks', kind: 'army-building' },
  1000107: { id: 'spiky-tower', name: 'Spiky Tower', kind: 'defense' },
  1000108: { id: 'firecracker-tower', name: 'Firecracker Tower', kind: 'defense' },
}

function baseCost(shown) {
  const base = shown / 0.8
  if (!Number.isInteger(base)) throw new Error(`cost ${shown} is not a clean 20 % discount`)
  return base
}

function baseTime(shown) {
  if (shown === 0) return 0
  // Discounted time t displays as `shown` when shown <= t < shown + 1 h.
  const lo = shown / 0.8
  const hi = (shown + H) / 0.8
  const candidates = []
  for (let h = Math.ceil(lo / H); h * H < hi; h++) candidates.push(h * H)
  const half = candidates.filter((t) => t % (12 * H) === 0)
  const pick = half.length === 1 ? half : candidates
  if (pick.length !== 1) throw new Error(`time ${shown} is ambiguous: ${candidates.map((t) => t / H + 'h')}`)
  return pick[0]
}

const byName = new Map(dataset.entities.map((e) => [e.name, e]))
const entities = new Map()
const listed = new Set()
const report = []

for (const [name, id, level, cost, resource, time] of observed) {
  const entity = id === null ? byName.get(name) : dataset.entities.find((e) => e.dataId === id)
  const dataId = entity ? entity.dataId : id
  if (!dataId) throw new Error(`unknown entity ${name}`)
  listed.add(dataId)
  const max = entity ? Math.max(0, ...entity.levels.map((l) => l.level)) : 0
  if (entity && level !== max + 1) throw new Error(`${name}: level ${level} does not follow dataset max ${max}`)
  const lvl = { level, cost: { [resource]: baseCost(cost) }, time: baseTime(time), townHallRequired: 19 }
  report.push(`${name.padEnd(20)} niv. ${String(level).padStart(2)}  ${cost.toLocaleString('fr-FR')} → ${lvl.cost[resource].toLocaleString('fr-FR')} ${resource}, ${(time / D).toFixed(2)} j → ${(lvl.time / D).toFixed(2)} j`)
  entities.set(dataId, {
    dataId,
    ...(added[dataId] ?? {}),
    note: `Relevé en jeu le 2026-11-19 (menu des constructeurs, HDV 19, Gold Pass actif : affiché ${cost} et ${time} s, valeurs de base = affiché / 0,8). Seul le prochain niveau est visible : d'autres niveaux HDV 19 peuvent exister.`,
    levels: [lvl],
  })
}

// Buildings, traps and guardians the player owns that the builder menu did NOT list are at the
// Town Hall 19 maximum. Declared only when the export agrees (level >= dataset max).
const sections = ['buildings', 'traps', 'guardians']
const owned = new Map()
for (const s of sections)
  for (const it of exp[s] ?? []) {
    if (!Number.isInteger(it.lvl)) continue
    const lvl = it.timer != null ? it.lvl + 1 : it.lvl
    owned.set(it.data, Math.max(owned.get(it.data) ?? 0, lvl))
  }
const skipKinds = new Set(['crafted-defense', 'helper', 'wall'])
// Upgrading in the game on 2026-11-19 (top of the builder menu): absence from the list proves nothing.
const upgradingNow = new Set([1000079, 1000084, 1000107, 1000108])
const contradictions = []
for (const [dataId, lvl] of owned) {
  if (listed.has(dataId) || upgradingNow.has(dataId)) continue
  const entity = dataset.entities.find((e) => e.dataId === dataId)
  if (!entity) {
    if (added[dataId] && !entities.has(dataId)) {
      entities.set(dataId, {
        dataId,
        ...added[dataId],
        note: `Nouvel élément HDV 19 (identifiant de l'export, nom lu en jeu le 2026-11-19). Coûts non visibles : amélioration en cours ou aucune amélioration proposée.`,
        ...(dataId === 1000105 ? { maxLevelByTownHall: { 19: 1 } } : {}),
      })
    }
    continue
  }
  if (skipKinds.has(entity.kind) || entity.kind === 'town-hall' || entity.levels.length === 0) continue
  const max = Math.max(0, ...entity.levels.map((l) => l.level))
  if (lvl < max) {
    contradictions.push(`${entity.name} : export niv. ${lvl} < max des données ${max}, absent du menu (amélioré depuis l'export ?)`)
    continue
  }
  entities.set(dataId, {
    dataId,
    note: `Absent du menu des constructeurs le 2026-11-19 : déjà au max de l'HDV 19 (niveau du joueur).`,
    maxLevelByTownHall: { 19: lvl },
  })
}
// The Town Hall itself: 19 is the current maximum.
entities.set(1000001, { dataId: 1000001, note: 'HDV 19 : niveau le plus haut du jeu au 2026-11-19.', maxLevelByTownHall: { 19: 19 } })

const out = { schemaVersion: 1, entities: [...entities.values()].sort((a, b) => a.dataId - b.dataId) }
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
console.log(report.join('\n'))
console.log(`\n${out.entities.length} entités surchargées`)
console.log(contradictions.length ? 'À vérifier :\n- ' + contradictions.join('\n- ') : 'Aucune contradiction avec l\'export.')
