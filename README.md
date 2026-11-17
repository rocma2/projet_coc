# projet_coc

Optimiseur de progression Clash of Clans : une application web qui dit au joueur **quoi faire maintenant** pour maxer son HDV le plus vite possible, selon ses propres choix. Elle ne se contente pas d'afficher une progression, elle décide : quoi acheter avec les médailles de ligue, où utiliser chaque objet magique, dans quel ordre améliorer, et combien de jours coûte chaque choix personnel. Tout tourne dans le navigateur : l'export du joueur ne quitte jamais l'appareil.

Spécification complète : [docs/PRD.md](docs/PRD.md).

## Prérequis

- Node.js 22 ou plus récent (développé avec Node.js 26) et npm.

## Commandes

```sh
npm install      # installe les dépendances
npm run dev      # serveur de développement (http://localhost:5173/projet_coc/)
npm run build    # vérification des types puis build de production dans dist/
npm run preview  # sert le build de production
npm test         # lance les tests une fois (Vitest)
npm run lint     # ESLint
```

## Organisation

```
src/
  engine/          moteur de simulation : TypeScript pur, sans React ni navigateur (règle ESLint)
  data/            données de jeu (à venir)
  ui/
    App.tsx        coquille : colonne au format téléphone, écran courant, barre du bas
    routes.ts      routage par fragment d'URL (#/today, #/plan…), sans dépendance
    tokens.css     jetons de design (couleurs, typo, espacements, rayons) + thème sombre
    styles.css     styles de base et mise en page des écrans
    components/    briques réutilisables (Card, PillButton, RingGauge, BottomNav, icônes…),
                   chacune avec sa feuille de style
    screens/       un écran par wireframe (import, questionnaire, aujourd'hui, plan,
                   hammer, inventaire, sources) + réglages
  i18n/            traductions français / anglais (clés typées)
  test/            configuration des tests
docs/
  PRD.md           spécification produit
  decisions.md     journal des décisions
  wireframes/      maquettes des 7 écrans : référence visuelle et structurelle de l'UI
```

La police Inter est servie par l'application elle-même (`@fontsource-variable/inter`) : aucune requête vers un service tiers.

## Mention légale

Projet personnel, non affilié à Supercell, ni approuvé, sponsorisé ou soutenu par Supercell. Clash of Clans est une marque de Supercell.
