# Cartes et aire de jeu

## Décision

Les cartes de MarketTycoon sont des assets de données indépendants de Phaser. Phaser ne crée pas le monde : il charge une définition validée, puis l'affiche et adapte les interactions du joueur.

```text
map.json
   ↓
@market-tycoon/world-map
   ↓ validation et modèle métier
WorldMapRuntime (étape suivante)
   ↓
adaptateur Phaser
   ↓
sols, routes, parcelles, bâtiments, équipements et agents
```

Cette séparation permet de tester les règles de propriété et d'extension sans rendu, de remplacer le moteur graphique et de construire plus tard un éditeur de cartes en Vue.

## Structure d'une carte

Chaque carte définit :

- les dimensions et le format des tuiles isométriques ;
- les parcelles et leur statut d'accès ;
- les bâtiments déjà présents ;
- les routes et cheminements ;
- les points d'apparition ;
- le magasin initial et ses équipements de départ.

Les équipements restent issus du catalogue général. Une carte ne redéfinit donc pas un rayon, une caisse ou un élément décoratif : elle référence leur `definitionKey` et fournit seulement leur position initiale.

## Statuts des parcelles

- `owned` : disponible dès le début ;
- `for-sale` : achetable par le joueur ;
- `locked` : déblocable par la progression ;
- `public` : accessible mais non constructible ;
- `reserved` : réservé à une fonctionnalité future ;
- `unavailable` : décor ou propriété définitivement externe.

Le statut d'accès et l'usage sont séparés. Une parcelle peut ainsi être achetable et destinée au parking, au commerce ou à la logistique.

## Bâtiments dynamiques

Un bâtiment `dynamic: true` pourra évoluer sans changer d'identité :

- extension de son emprise ;
- façade et enseigne ;
- entrées et vitrines ;
- pièces intérieures ;
- étages ou annexes dans une évolution ultérieure.

Les murs et équipements intérieurs restent des entités placées. Le bâtiment apporte le contexte immobilier et la propriété, sans remplacer le système générique d'équipements.

## Création hors de Phaser

### Étape actuelle : JSON versionné

Les cartes de démonstration sont stockées dans :

```text
apps/game/public/maps/<map-id>/map.json
```

C'est le format source de référence. Il est lisible, diffable dans Git et validé par `@market-tycoon/world-map`.

### Étape suivante : éditeur Vue

Un éditeur dédié devra manipuler ce même format :

1. grille isométrique ou vue orthogonale simplifiée ;
2. dessin des parcelles par rectangles ou polygones ;
3. attribution des statuts, prix et conditions ;
4. placement des bâtiments, routes et points d'apparition ;
5. prévisualisation du magasin initial ;
6. validation et export du `map.json`.

L'éditeur ne doit pas dépendre d'une scène de jeu. Une prévisualisation Phaser peut être ajoutée comme adaptateur optionnel, mais la saisie et la validation restent en Vue et dans le package métier.

## Cartes de démonstration

### Parc commercial

- petit magasin et parking possédés ;
- extension ouest immédiatement achetable ;
- extension est verrouillée par la progression ;
- zone logistique réservée ;
- commerce voisin non achetable.

### Centre-ville

- surface initiale compacte ;
- cour arrière logistique ;
- immeuble voisin achetable mais coûteux ;
- seconde extension verrouillée par la réputation ;
- rue piétonne et boulevard publics.

## Prochaines étapes techniques

1. créer un `WorldMapRuntime` qui suit propriété, déblocages et achats ;
2. charger la carte sélectionnée avant la création de `StoreScene` ;
3. adapter `GridManager` pour distinguer limites de carte et cellules constructibles ;
4. instancier le magasin et les équipements initiaux depuis `initialStore` ;
5. ajouter un overlay des parcelles et un panneau d'achat ;
6. introduire l'historique annuler/refaire du Build Mode ;
7. développer l'éditeur Vue utilisant les mêmes contrats.
