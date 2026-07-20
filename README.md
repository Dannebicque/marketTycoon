# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités du prototype

- grille logique 16 × 16 avec projection isométrique ;
- aperçu vert ou rouge avant construction ;
- placement de rayons occupant plusieurs cases ;
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
| Clic gauche | Placer un rayon |
| Clic droit | Supprimer un rayon |
| `R` | Faire pivoter le rayon |
| Molette | Zoomer ou dézoomer |

## Prochaines étapes possibles

1. Ajouter plusieurs catégories de bâtiments : murs, portes, caisses et réserves.
2. Créer une grille de navigation distincte de la grille de construction.
3. Ajouter le pathfinding A* et les premiers clients.
4. Remplacer les formes vectorielles par des sprites isométriques.
5. Ajouter un état de jeu Pinia et la sauvegarde.
