# Roadmap — Aire de jeu, construction et expansion

Cette roadmap complète `ROADMAP.md` avec un axe prioritaire centré sur la jouabilité de la construction. Le principe directeur est : **construire un magasin doit être agréable avant même que sa gestion soit complexe**.

## 1. Monde et cartes déclaratives

- [x] Créer le package indépendant `@market-tycoon/world-map`
- [x] Définir les contrats de carte, parcelles, routes, bâtiments et points d'apparition
- [x] Valider les cartes avant leur utilisation par le rendu
- [x] Ajouter une carte de démonstration « Parc commercial »
- [x] Ajouter une carte de démonstration « Centre-ville »
- [x] Créer un `WorldMapRuntime` pour suivre propriété, achats et déblocages
- [x] Charger une carte avant l'initialisation de la scène Phaser
- [x] Instancier le magasin et les équipements initiaux depuis la carte
- [x] Séparer cellules accessibles, constructibles et possédées
- [x] Ajouter l'overlay et le panneau d'achat des parcelles
- [x] Distinguer aperçu au survol et sélection de parcelle épinglée au clic
- [x] Identifier toutes les parcelles possédées par un cadre blanc
- [x] Distinguer les surfaces bâties des terrains seulement possédés

## 2. Bâtiments dynamiques

- [x] Introduire une entité bâtiment indépendante de ses murs et équipements
- [x] Gérer l'emprise et conserver les entrées et le style de façade dans le runtime
- [ ] Ajouter les outils de modification des entrées, façades et enseignes
- [x] Autoriser l'extension d'un bâtiment sur une parcelle nouvellement acquise
- [x] Autoriser la construction partielle d'une pièce sur un terrain possédé et constructible
- [x] Conserver l'identité du bâtiment lors des transformations
- [x] Préparer les opérations inverses d'achat et d'extension dans le runtime
- [ ] Préparer les annexes : réserve, drive, bureaux, quai et galerie
- [ ] Préparer plusieurs niveaux sans rendre cette fonctionnalité obligatoire

## 3. Architecture de construction

- [x] Créer le package `@market-tycoon/construction`
- [x] Séparer le pilotage des outils (`build-mode`) de la logique métier (`construction`)
- [x] Ajouter un catalogue unifié pour sols, murs, façades et futurs matériaux
- [x] Ajouter un modèle de prévisualisation indépendant du renderer
- [x] Ajouter une file d'ordres de construction avec états planifié, chantier et terminé
- [x] Conserver des réexports temporaires dans `build-mode` pour migrer progressivement
- [ ] Déplacer définitivement les surfaces de sol dans `construction`
- [ ] Introduire un vrai modèle métier de murs, portes, vitrines et fenêtres
- [ ] Raccorder les ordres à une durée de chantier et à des ouvriers

## 4. Build Mode orienté outils

- [x] Extraire un package `build-mode` indépendant de Phaser
- [x] Utiliser les équipements du catalogue comme placables du premier adaptateur
- [x] Ajouter un contrôleur explicite pour les outils sélection, placement, déplacement, suppression et rotation
- [x] Raccorder sélection, déplacement et suppression à l'interface principale
- [x] Rendre le déplacement indépendant du flux de placement standard
- [x] Afficher explicitement l'équipement en attente de destination
- [x] Conserver assortiment et stock lors d'un déplacement ou d'une restauration
- [x] Regrouper outils, diagnostic et historique dans une barre horizontale sous la topbar
- [x] Conserver la sidebar à sa position d'origine malgré la barre horizontale
- [x] Ajouter une politique de remboursement de démolition configurable par difficulté
- [ ] Intégrer la difficulté de construction dans les paramètres globaux de partie
- [x] Ajouter le domaine indépendant des surfaces de sol
- [x] Ajouter l'outil pièce rectangulaire avec murs et sol
- [x] Ajouter l'outil sol rectangulaire
- [x] Ajouter l'outil remplissage de surface intérieure
- [x] Ajouter plusieurs styles de sols sélectionnables
- [ ] Appliquer les coûts de revêtement à la trésorerie
- [ ] Ajouter des textures ou motifs d'image aux styles de sols
- [x] Ajouter une prévisualisation graphique du rectangle avant validation
- [x] Afficher dimensions, validité et coût estimé dans le ghost
- [ ] Ajouter multi-sélection et déplacement d'un groupe
- [ ] Ajouter copier/coller
- [x] Ajouter l'historique annuler/refaire pour les poses, suppressions et déplacements
- [x] Intégrer achats de parcelles, extensions, surfaces et peinture des zones dans le même historique
- [x] Afficher les causes précises d'un placement invalide
- [ ] Viser moins de trois actions pour les opérations courantes

## 5. Blueprints

- [ ] Définir un format indépendant du rendu
- [ ] Enregistrer équipements, murs, sols et métadonnées de secteur
- [ ] Prévisualiser et valider un blueprint avant placement
- [ ] Calculer coût, emprise et conflits avec `@market-tycoon/construction`
- [ ] Fournir quelques modèles de départ
- [ ] Préparer import/export et partage futur

## 6. Personnalisation

- [ ] Nom, identité et couleurs de l'enseigne
- [ ] Façades, vitrines, portes et enseignes
- [ ] Styles de sols, murs et équipements
- [ ] Signalétique, éclairage et décorations
- [ ] Uniformes et ambiance du magasin
- [ ] Décorations saisonnières

## 7. Éditeur de cartes hors Phaser

- [ ] Créer une application Vue dédiée à l'édition
- [ ] Dessiner les parcelles et définir leurs statuts
- [ ] Placer bâtiments, routes et points d'apparition
- [ ] Configurer prix et conditions de déblocage
- [ ] Placer les équipements du magasin initial depuis le catalogue
- [ ] Valider avec `@market-tycoon/world-map`
- [ ] Exporter le même `map.json` que celui chargé par le jeu
- [ ] Ajouter une prévisualisation Phaser optionnelle

## 8. Merchandising à conserver pour la suite

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
6. package Construction et prévisualisations ;
7. bâtiments dynamiques et vrais murs ;
8. blueprints ;
9. éditeur de cartes Vue ;
10. analyse de layout et merchandising.
