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
- [x] Ajouter les premiers outils de modification des murs, portes, fenêtres et vitrines
- [ ] Ajouter les outils de modification des façades et enseignes
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
- [x] Déplacer définitivement les surfaces de sol dans `construction`
- [x] Enregistrer pièces et revêtements dans la file d'ordres
- [x] Rendre les ordres compatibles avec annulation et rétablissement
- [x] Introduire un modèle métier de segments pour murs, portes, vitrines et fenêtres
- [x] Permettre le remplacement d'un segment sans perdre son identité
- [x] Définir transparence, collision, lumière et visibilité par type de segment
- [x] Identifier les segments réellement extérieurs
- [x] Calculer lumière naturelle, visibilité commerciale et ratio vitré de façade
- [x] Raccorder les ordres à une durée minimale de chantier
- [ ] Affecter des ouvriers aux ordres de construction
- [ ] Différer réellement l'apparition des constructions jusqu'à la fin du chantier

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
- [x] Ajouter l'outil mur orientable
- [x] Ajouter les outils porte, fenêtre et vitrine par remplacement d'un mur
- [x] Limiter fenêtres et vitrines aux façades extérieures
- [x] Ajouter un rendu distinct pour portes, fenêtres et vitrines
- [x] Ajouter un indicateur de qualité de façade
- [x] Ajouter l'outil sol rectangulaire
- [x] Ajouter l'outil remplissage de surface intérieure
- [x] Ajouter plusieurs styles de sols sélectionnables
- [x] Appliquer les coûts de revêtement, murs et ouvertures à la trésorerie
- [x] Refuser une construction lorsque le budget est insuffisant
- [x] Rembourser les coûts lors d'une annulation et les débiter lors d'un rétablissement
- [ ] Ajouter des textures ou motifs d'image aux styles de sols
- [x] Ajouter une prévisualisation graphique du rectangle avant validation
- [x] Afficher dimensions, validité et coût estimé dans le ghost
- [x] Ajouter une prévisualisation précise des segments structurels
- [x] Donner aux fenêtres et vitrines leurs propres règles de visibilité
- [ ] Relier lumière naturelle et visibilité à la satisfaction et à l'attractivité
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
