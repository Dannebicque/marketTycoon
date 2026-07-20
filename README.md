# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités du prototype

- grille logique 16 × 16 avec projection isométrique ;
- catalogue de construction avec rayons, caisses, murs et portes ;
- construction continue des murs par glisser-déposer ;
- meubles placés sur les cellules de la grille ;
- murs et portes placés sur les arêtes des cellules ;
- une porte remplace obligatoirement un segment de mur existant ;
- grille de navigation distincte de la construction ;
- murs bloquants et portes traversables ;
- pathfinding A* ;
- premier cycle client : entrée → rayon → caisse → sortie ;
- visualisation du chemin calculé et messages d’état ;
- séparation entre la logique de grille, la navigation, les agents et le rendu Phaser.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l’adresse indiquée par Vite, généralement `http://localhost:5173`.

## Tester le cycle client

1. Placer au moins un rayon avec `1`.
2. Placer au moins une caisse avec `2`.
3. Construire éventuellement des murs avec `3` et des portes avec `4`.
4. Vérifier qu’un chemin existe depuis la case d’entrée `(0, 0)`.
5. Appuyer sur `C`.

Le prototype calcule le plus court chemin vers une case libre voisine du rayon, puis vers une case libre voisine de la caisse, avant de revenir à la sortie.

## Commandes

| Commande | Action |
|---|---|
| `1` | Sélectionner un rayon |
| `2` | Sélectionner une caisse |
| `3` | Sélectionner un mur |
| `4` | Sélectionner une porte |
| Clic gauche | Placer l’élément sélectionné |
| Glisser avec l’outil mur | Tracer plusieurs murs |
| Clic droit | Supprimer l’élément ou l’arête orientée |
| `R` | Faire pivoter l’élément ou changer l’axe du mur |
| `C` | Lancer le cycle d’un client |
| `Échap` | Masquer l’aperçu |
| Molette | Zoomer ou dézoomer |

## Règles de navigation

- un rayon ou une caisse rend ses cellules non traversables ;
- un mur bloque le passage entre deux cellules voisines ;
- une porte autorise le passage sur cette même arête ;
- le client vise une cellule libre adjacente au rayon et à la caisse ;
- un message explicite est affiché lorsqu’une étape est inaccessible.

## Prochaines étapes possibles

1. Ajouter plusieurs clients et une fréquence d’arrivée.
2. Créer une vraie file d’attente devant les caisses.
3. Associer des produits, capacités et stocks aux rayons.
4. Ajouter les temps de service et la satisfaction client.
5. Déplacer l’état de simulation dans Pinia et ajouter la sauvegarde.
