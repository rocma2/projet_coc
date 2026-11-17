# Optimiseur Clash of Clans — journal des décisions

Source : doc « Prompt – Optimiseur Clash of Clans » + interview « grill-me » (tours 1 à 4).
Ce fichier alimente le PRD. Il ne contient aucune donnée personnelle (l'export du joueur est dans `private/`, ignoré par Git).

## Produit
- **Objectif :** dire au joueur *quoi faire maintenant* pour maxer son HDV le plus vite possible selon ses choix. Ce n'est pas un tracker.
- **Public :** le joueur seul d'abord, pour voir ce que ça donne. Ouverture à d'autres joueurs plus tard, rien de construit pour ça en V1.
- **Plateforme :** application web (React + TypeScript + Vite), 100 % dans le navigateur, sans serveur ni compte. Prête à devenir une PWA installable.
- **Langues :** français et anglais.
- **API Supercell :** pas en V1 (clé liée à une IP, donc serveur). Ligue et médailles saisies à la main.

## Définition de « maxé »
- Relative à l'HDV précédent : avant de passer au HDV suivant, les défenses doivent être maxées, plus ce qui est important/meta pour le joueur (héros, labo). Pas besoin de tout maxer.
- Deux jalons : **défenses maxées** (principal) et **tout maxé** (optionnel).
- Le joueur choisit ses héros, troupes et équipements « importants ». L'app propose une liste meta par défaut, modifiable.
- Pas de date limite imposée : date cible optionnelle (le HDV suivant sort environ une fois par an, souvent novembre-décembre, au plus tard vers le T3 ; à confirmer sur internet).

## Calcul
- **Simulation** du village jour après jour (constructeurs, labo, médailles, hammers, potions), avec règles de priorité. Les « coûts en jours » viennent de la comparaison de deux simulations.
- **Plan de référence** (aucune source extra) et **plan avec les sources réelles** du joueur (Gold Pass, médailles de ligue/CWL, médailles d'event, Event Pass). L'écart est affiché source par source.
- **Gold Pass :** −20 % sur le coût et le temps des bâtiments et du labo (catégories exactes à vérifier : murs, héros, équipements).
- **Trois profils** : Efficace, Équilibré, Relax. Chaque option reste modifiable (héros tous d'un coup ou deux à la fois, murs d'abord ou en remplissage, farm d'élixir noir à fond ou limité). Chaque choix affiche son coût en jours par rapport au profil Efficace.
- **Acheter tout de suite ou attendre :** l'app simule les deux cas, retient le plus rapide et affiche l'alternative chiffrée.
  - Cas test du joueur : un hammer sur une amélioration de 15 j maintenant, ou attendre 3 j (fin d'un firecracker niveau 0) et le mettre sur le niveau suivant de 16 j.
- **7ᵉ constructeur (Goblin Builder) :** ignoré. Le coût en gemmes est jugé trop élevé pour que ça vaille le coup.
- **Recalcul :** automatique à chaque changement (inventaire, médailles, réponses). Rappels dans l'app à l'ouverture : médailles de ligue chaque mois, médailles d'event chaque semaine. Pas de notification poussée en V1.
- **Données manquantes :** le joueur peut corriger ou saisir n'importe quelle donnée à la main (fichier de surcharges). Un élément sans donnée est affiché « à venir » et exclu du calcul.

## Entrées
- **Export JSON du jeu** (collé ou chargé en fichier) : niveaux, chantiers en cours (`timer` en secondes), aides, boosts. Les éléments sont identifiés par des nombres : il faut une table identifiant → nom.
- **Non présent dans l'export :** médailles, inventaire d'objets magiques, passes, ressources, nombre exact de constructeurs. Ils sont saisis par le joueur. Le nombre de constructeurs est déduit de l'export et confirmé.
- **Données de jeu :** paquet `clash-of-clans-data` (MIT), à vérifier pour le HDV 19. Les surcharges du joueur passent avant.

## Version 1
- Constructeurs, médailles de ligue, hammers, potions d'ouvrier et inventaire.
- **Inventaire V1 :** tous les types de livres, tous les hammers, potions d'ouvrier et de recherche (labo), avec pour chaque objet la quantité en inventaire et la quantité « non réclamée sur le pass ».
- Les aides (apprenti, assistant du labo) sont affichées mais pas calculées en V1.
- Contenu automatique des passes : version suivante.

## Questions encore ouvertes
- Médailles d'event : que vendent-elles et à quel prix ? (liste attendue du joueur)
- Catégories exactes du −20 % du Gold Pass.
- Date de sortie probable du HDV 20.
- Table identifiant → nom pour le HDV 19.
- Règles de calcul détaillées (tour 5) : hammers, potions, cooldown, plafond de 2 500 médailles.
