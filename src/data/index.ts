/**
 * Données de jeu prêtes à l'emploi : jeu de données généré + surcharges du repo.
 * Pas encore importé par l'UI (le bundle n'en dépend pas tant qu'aucun écran ne s'en sert).
 */
import type { GameDataOverrides, GameDataset } from '../engine/index.ts'
import dataset from './generated/game-data.json'
import overrides from './overrides.json'

export const gameDataset = dataset as GameDataset
export const repoOverrides = overrides as GameDataOverrides
