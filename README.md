# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- rayons, caisses, murs et portes ;
- construction continue des murs ;
- pathfinding A* respectant murs et portes ;
- choix automatique d’une cellule d’entrée accessible sur le bord du magasin ;
- validation du premier trajet avant l’apparition d’un client ;
- plusieurs clients simultanés ;
- arrivées manuelles ou automatiques ;
- paniers de 1 à 9 articles répartis sur 1 à 3 rayons ;
- quatre catégories de produits : épicerie, frais, boissons et hygiène ;
- choix de la caisse la moins chargée ;
- clients physiquement positionnés dans les files ;
- patience, satisfaction et abandon des files trop longues ;
- durée de scan proportionnelle au nombre d’articles ;
- paiements sans contact, carte et espèces avec durées différentes ;
- stock propre à chaque rayon et compteurs actualisés ;
- trésorerie, chiffre d’affaires et résultat ;
- horloge accélérée de 8 h à 20 h ;
- fermeture automatique et bilan de fin de journée ;
- rotation de la scène par quarts de tour ;
- déplacement et zoom de la caméra.

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
| Clic gauche | Placer l’élément ou tracer des murs |
| Clic droit | Supprimer l’élément ou l’arête orientée |
| `R` | Faire pivoter l’objet ou changer l’axe |
| `C` | Faire entrer un client |
| `Maj + S` | Activer ou couper les arrivées automatiques |
| `A` | Réapprovisionner tous les rayons |
| `N` | Démarrer le jour suivant après fermeture |
| `Q` / `E` | Tourner la scène de 90° |
| Flèches | Déplacer la caméra |
| Bouton central + glisser | Déplacer la caméra à la souris |
| Molette | Zoomer ou dézoomer |

La rotation est bloquée tant que des clients sont présents, afin de ne pas interrompre leurs animations en cours.

## Scénario de test

1. Construire plusieurs rayons et au moins une caisse.
2. Créer une enceinte avec des murs et conserver une porte ou un passage accessible depuis le bord.
3. Faire entrer un client avec `C`.
4. Vérifier que le client apparaît sur une cellule de bord accessible et ne traverse aucun mur.
5. Fermer toutes les entrées avec des murs et vérifier qu’aucun client n’apparaît.
6. Tourner la scène avec `Q` et `E` lorsqu’elle est vide.
7. Déplacer la vue avec les flèches ou le bouton central.
8. Vérifier que la sélection de cases reste correcte après rotation et déplacement.

## Architecture

- `GridManager` : occupation, collisions, transformation et rotation de la vue ;
- `NavigationGrid` : calcul A* et règles de traversée ;
- `CustomerAgent` : représentation, panier, humeur et déplacement ;
- `StoreSimulation` : produits, stocks, paniers, files, paiements et économie ;
- `StoreScene` : cycle journalier, caméra, orchestration et rendu Phaser.

## Prochaines étapes techniques

1. Déplacer le HUD et les commandes vers Vue et Pinia.
2. Ajouter sauvegarde et chargement du magasin.
3. Ajouter des employés et l’ouverture individuelle des caisses.
4. Ajouter les commandes fournisseurs et une réserve physique.
5. Ajouter des objectifs, événements et progression du magasin.
