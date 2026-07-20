# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- rayons, caisses, murs et portes ;
- construction continue des murs ;
- pathfinding A* respectant murs et portes ;
- choix automatique d’une cellule d’entrée accessible sur le bord du magasin ;
- plusieurs clients simultanés avec paniers multi-articles ;
- quatre catégories de produits ;
- files physiques et temps de caisse variables ;
- stock propre à chaque rayon ;
- horloge accélérée de 8 h à 20 h ;
- fermeture automatique et bilan de fin de journée ;
- rotation, déplacement et zoom de la caméra ;
- interface de gestion en Vue superposée à la scène Phaser.

## Économie minimale

- budget initial : **2 000 €** ;
- coûts de construction débités lors de la pose ;
- coût d’achat des marchandises débité lors du réapprovisionnement ;
- chiffre d’affaires ajouté lors de l’encaissement ;
- suivi séparé des dépenses de construction et de marchandises ;
- bénéfice journalier calculé ainsi :

```text
bénéfice du jour = chiffre d’affaires du jour
                    - constructions du jour
                    - achats de marchandises du jour
```

## Interface Vue

L’interface Vue affiche en temps réel :

- budget disponible ;
- heure et numéro du jour ;
- clients présents ;
- stock total ;
- chiffre d’affaires du jour ;
- coût des marchandises ;
- bénéfice du jour.

La barre d’outils permet de sélectionner rayon, caisse, mur ou porte, de générer un client, d’activer les arrivées automatiques et de réapprovisionner.

Le panneau latéral permet de sélectionner un rayon ou une caisse :

- rayon : produit, stock, capacité, prix de vente et coût d’achat ;
- caisse : taille de la file, état et coût de construction.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l’adresse indiquée par Vite, généralement `http://localhost:5173`.

## Commandes AZERTY

| Commande | Action |
|---|---|
| `1` à `4` | Sélectionner un outil de construction |
| Clic gauche | Placer l’élément ou tracer des murs |
| Clic droit | Supprimer l’élément ou l’arête orientée |
| `R` | Faire pivoter l’objet ou changer l’axe |
| `C` | Faire entrer un client |
| `Maj + S` | Activer ou couper les arrivées automatiques |
| `Maj + A` | Réapprovisionner tous les rayons |
| `N` | Démarrer le jour suivant après fermeture |
| `A` / `E` | Tourner la scène de 90° |
| `ZQSD` ou flèches | Déplacer la caméra |
| Bouton central + glisser | Déplacer la caméra à la souris |
| Molette | Zoomer ou dézoomer |

## Scénario de test

1. Observer le budget initial de 2 000 € dans le HUD Vue.
2. Construire un rayon et une caisse depuis la barre d’outils.
3. Vérifier la baisse du budget et l’augmentation des dépenses de construction.
4. Générer plusieurs clients et observer le chiffre d’affaires.
5. Consommer du stock puis utiliser « Réappro. ».
6. Vérifier le coût des marchandises et le bénéfice journalier.
7. Sélectionner un rayon dans le panneau latéral et vérifier son stock.
8. Sélectionner une caisse et vérifier la taille de sa file.

## Architecture

- `GridManager` : occupation, collisions, transformation et rotation de la vue ;
- `NavigationGrid` : calcul A* et règles de traversée ;
- `CustomerAgent` : représentation, panier, humeur et déplacement ;
- `StoreSimulation` : produits, stocks, paniers, files, paiements et économie ;
- `StoreScene` : cycle journalier, caméra, orchestration et rendu Phaser ;
- `App.vue` : HUD, barre d’outils et panneau de gestion.

## Prochaines étapes techniques

1. Remplacer le rafraîchissement périodique par un store Pinia et des événements typés.
2. Ajouter sauvegarde et chargement du magasin.
3. Ajouter des employés et l’ouverture individuelle des caisses.
4. Ajouter les commandes fournisseurs et une réserve physique.
5. Ajouter des objectifs, événements et progression du magasin.
