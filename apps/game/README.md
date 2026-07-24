# Application de jeu

Ce dossier représente l’adaptateur interactif de Market Tycoon.

Il accueillera progressivement :

- l’application Vue ;
- la scène Phaser ;
- les composants et panneaux ;
- les entrées clavier et souris ;
- les animations et le rendu.

Les règles métier ne doivent pas être ajoutées ici. Elles appartiennent aux packages du moteur.

Pendant la migration incrémentale, les fichiers exécutables restent dans `src/`. Les imports publics passent progressivement par les packages `@market-tycoon/*` avant le déplacement physique final.
