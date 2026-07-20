# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- rayons, caisses, murs et portes ;
- construction continue des murs ;
- pathfinding A* respectant murs et portes ;
- plusieurs clients simultanés ;
- arrivées manuelles ou automatiques ;
- paniers de 1 à 9 articles répartis sur 1 à 3 rayons ;
- quatre catégories de produits : épicerie, frais, boissons et hygiène ;
- couleur et libellé propres à chaque catégorie ;
- choix de la caisse la moins chargée ;
- clients physiquement positionnés dans les files ;
- patience, satisfaction et abandon des files trop longues ;
- durée de scan proportionnelle au nombre d’articles ;
- paiements sans contact, carte et espèces avec durées différentes ;
- suivi du nombre d’articles et des moyens de paiement ;
- stock propre à chaque rayon et compteurs actualisés ;
- réapprovisionnement global ;
- trésorerie, chiffre d’affaires et résultat ;
- horloge accélérée de 8 h à 20 h ;
- fermeture automatique du magasin ;
- bilan de fin de journée ;
- passage au jour suivant.

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
| `R` | Faire pivoter ou changer l’axe |
| `C` | Faire entrer un client |
| `S` | Activer ou couper les arrivées automatiques |
| `A` | Réapprovisionner tous les rayons |
| `N` | Démarrer le jour suivant après fermeture |
| Molette | Zoomer ou dézoomer |

## Scénario de test

1. Construire plusieurs rayons afin d’obtenir différentes catégories de produits.
2. Construire au moins une caisse.
3. Activer les arrivées automatiques avec `S`.
4. Observer les clients visiter plusieurs rayons et remplir leur panier.
5. Vérifier le nombre d’articles affiché à côté de chaque client.
6. Observer les clients occuper des positions successives dans la file.
7. Comparer les durées de caisse selon le panier et le moyen de paiement.
8. Laisser l’horloge atteindre 20 h et consulter le bilan.
9. Attendre le départ des derniers clients, puis appuyer sur `N`.

## Architecture

- `GridManager` : occupation des cellules, arêtes et règles de collision ;
- `NavigationGrid` : calcul A* et règles de traversée ;
- `CustomerAgent` : représentation, panier, humeur et déplacement ;
- `StoreSimulation` : produits, stocks, paniers, files, paiements et économie ;
- `StoreScene` : cycle journalier, orchestration et rendu Phaser.

## Prochaines étapes techniques

1. Déplacer le HUD et les commandes vers Vue et Pinia.
2. Ajouter sauvegarde et chargement du magasin.
3. Ajouter des employés et l’ouverture individuelle des caisses.
4. Ajouter les commandes fournisseurs et une réserve physique.
5. Ajouter des objectifs, événements et progression du magasin.
