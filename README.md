# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités du prototype

- grille logique 16 × 16 avec projection isométrique ;
- aperçu vert ou rouge avant construction ;
- catalogue de construction avec rayons, caisses, murs et portes ;
- tailles d’occupation différentes selon l’élément ;
- rotation avec la touche `R` ;
- suppression avec le clic droit ;
- zoom avec la molette ;
- séparation entre la logique de grille et le rendu Phaser.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l’adresse indiquée par Vite, généralement `http://localhost:5173`.

## Commandes

| Commande | Action |
|---|---|
| `1` | Sélectionner un rayon |
| `2` | Sélectionner une caisse |
| `3` | Sélectionner un mur |
| `4` | Sélectionner une porte |
| Clic gauche | Placer l’élément sélectionné |
| Clic droit | Supprimer un élément |
| `R` | Faire pivoter l’élément |
| `Échap` | Masquer l’aperçu |
| Molette | Zoomer ou dézoomer |

## Prochaines étapes possibles

1. Ajouter une vraie construction continue des murs.
2. Imposer qu’une porte soit intégrée à un mur.
3. Créer une grille de navigation distincte de la grille de construction.
4. Ajouter le pathfinding A* et les premiers clients.
5. Remplacer les formes vectorielles par des sprites isométriques.
6. Ajouter un état de jeu Pinia et la sauvegarde.
