# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités du prototype

- grille logique 16 × 16 avec projection isométrique ;
- aperçu vert ou rouge avant construction ;
- catalogue de construction avec rayons, caisses, murs et portes ;
- meubles placés sur les cellules de la grille ;
- murs et portes placés sur les arêtes des cellules ;
- une porte remplace obligatoirement un segment de mur existant ;
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
| Clic droit | Supprimer l’élément ou l’arête orientée |
| `R` | Faire pivoter l’élément ou changer l’axe du mur |
| `Échap` | Masquer l’aperçu |
| Molette | Zoomer ou dézoomer |

## Règles des murs et portes

- un mur occupe une arête et ne bloque plus toute la case ;
- deux murs peuvent donc border une même cellule sur deux axes différents ;
- une porte ne peut être placée que sur une arête contenant déjà un mur ;
- placer la porte remplace ce mur sans occuper la cellule ;
- le clic droit vise d’abord l’arête correspondant à l’orientation active, puis le meuble de la cellule.

## Prochaines étapes possibles

1. Ajouter une construction continue des murs par glisser-déposer.
2. Exploiter les arêtes dans une grille de navigation.
3. Ajouter le pathfinding A* et les premiers clients.
4. Remplacer les formes vectorielles par des sprites isométriques.
5. Ajouter un état de jeu Pinia et la sauvegarde.
