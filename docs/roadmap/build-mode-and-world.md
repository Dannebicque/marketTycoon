# Roadmap — Aire de jeu, construction et expansion

Cette roadmap complète `ROADMAP.md` avec un axe prioritaire centré sur la jouabilité de la construction. Le principe directeur est : **construire un magasin doit être agréable avant même que sa gestion soit complexe**.

## 1. Monde et cartes déclaratives

- [x] Créer le package indépendant `@market-tycoon/world-map`
- [x] Définir les contrats de carte, parcelles, routes, bâtiments et points d'apparition
- [x] Valider les cartes avant leur utilisation par le rendu
- [x] Ajouter une carte de démonstration « Parc commercial »
- [x] Ajouter une carte de démonstration « Centre-ville »
- [ ] Créer un `WorldMapRuntime` pour suivre propriété, achats et déblocages
- [ ] Charger une carte avant l'initialisation de la scène Phaser
- [ ] Instancier le magasin et les équipements initiaux depuis la carte
- [ ] Séparer cellules accessibles, constructibles et possédées
- [ ] Ajouter l'overlay et le panneau d'achat des parcelles

## 2. Bâtiments dynamiques

- [ ] Introduire une entité bâtiment indépendante de ses murs et équipements
- [ ] Gérer emprise, entrées, façade, enseigne et style
- [ ] Autoriser l'extension d'un bâtiment sur une parcelle nouvellement acquise
- [ ] Conserver l'identité du bâtiment lors des transformations
- [ ] Préparer les annexes : réserve, drive, bureaux, quai et galerie
- [ ] Préparer plusieurs niveaux sans rendre cette fonctionnalité obligatoire

## 3. Build Mode orienté outils

- [ ] Extraire un package `build-mode` indépendant de Phaser
- [ ] Unifier les placables sous la notion d'équipement de catalogue
- [ ] Ajouter les outils sélection, placement, déplacement, suppression et rotation
- [ ] Ajouter les outils mur, rectangle de pièce, sol et remplissage
- [ ] Ajouter multi-sélection et déplacement d'un groupe
- [ ] Ajouter copier/coller
- [ ] Ajouter historique annuler/refaire
- [ ] Afficher les causes précises d'un placement invalide
- [ ] Viser moins de trois actions pour les opérations courantes

## 4. Blueprints

- [ ] Définir un format indépendant du rendu
- [ ] Enregistrer équipements, murs, sols et métadonnées de secteur
- [ ] Prévisualiser et valider un blueprint avant placement
- [ ] Calculer coût, emprise et conflits
- [ ] Fournir quelques modèles de départ
- [ ] Préparer import/export et partage futur

## 5. Personnalisation

- [ ] Nom, identité et couleurs de l'enseigne
- [ ] Façades, vitrines, portes et enseignes
- [ ] Styles de sols, murs et équipements
- [ ] Signalétique, éclairage et décorations
- [ ] Uniformes et ambiance du magasin
- [ ] Décorations saisonnières

## 6. Éditeur de cartes hors Phaser

- [ ] Créer une application Vue dédiée à l'édition
- [ ] Dessiner les parcelles et définir leurs statuts
- [ ] Placer bâtiments, routes et points d'apparition
- [ ] Configurer prix et conditions de déblocage
- [ ] Placer les équipements du magasin initial depuis le catalogue
- [ ] Valider avec `@market-tycoon/world-map`
- [ ] Exporter le même `map.json` que celui chargé par le jeu
- [ ] Ajouter une prévisualisation Phaser optionnelle

## 7. Merchandising à conserver pour la suite

- [ ] Créer un package `store-layout`
- [ ] Calculer organisation, compacité, dispersion et densité par secteur
- [ ] Relier les équipements de vente à leurs secteurs commerciaux
- [ ] Introduire assortiment, capacité, facings et stock par équipement
- [ ] Faire rechercher aux clients un secteur, puis un équipement, puis un produit
- [ ] Ajouter têtes de gondole, îlots, saisonnalité et cross-merchandising

## Ordre recommandé

1. runtime de carte et parcelles ;
2. chargement de la carte dans Phaser ;
3. équipement initial et limites constructibles ;
4. achat de parcelles ;
5. package Build Mode et historique ;
6. bâtiments dynamiques ;
7. blueprints ;
8. éditeur de cartes Vue ;
9. analyse de layout et merchandising.
