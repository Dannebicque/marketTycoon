# Contribuer à Market Tycoon

## Installation

```bash
npm install
npm run dev
```

Vérifications avant une proposition de modification :

```bash
npm run typecheck
npm run build
```

## Organisation d’une modification

Une contribution doit rester centrée sur un objectif métier clair.

1. Décrire le comportement attendu.
2. Identifier le manager ou le catalogue responsable.
3. Ajouter ou modifier les types avant l’interface.
4. Garder Phaser limité au rendu et aux agents.
5. Prévoir la sauvegarde si un nouvel état est persistant.
6. Ajouter des événements métier pour les faits utiles à d’autres systèmes.
7. Documenter les choix non évidents.

## Conventions TypeScript

- Le mode strict reste activé.
- Éviter `any`; préférer un type local, un DTO ou `unknown` avec validation.
- Utiliser des unions discriminées pour les états et événements.
- Retourner des copies lorsque l’état interne d’un manager ne doit pas être muté.
- Refuser tôt les entrées invalides.
- Les fonctions de calcul métier doivent être déterministes autant que possible.

## Managers

Un manager doit :

- posséder une responsabilité principale ;
- encapsuler son état ;
- exposer des opérations métier explicites ;
- fournir un export/import sérialisable si son état doit être sauvegardé ;
- ne pas dépendre de Vue ou de Phaser ;
- être testable sans navigateur.

## Catalogues

Chaque entrée possède une clé stable et unique. Les clés sont utilisées dans les sauvegardes et ne doivent pas être renommées sans migration.

Une nouvelle définition doit préciser :

- sa clé ;
- son nom ;
- ses valeurs métier ;
- son ordre d’affichage si nécessaire ;
- ses contraintes de validation.

## Composants Vue

- Les props et événements doivent être typés.
- Un composant de gestion ne modifie pas directement un manager global.
- Les calculs complexes sont préparés dans un composable, un manager ou un modèle de vue.
- Les textes visibles sont rédigés en français cohérent.
- Les états vides, erreurs et actions désactivées doivent être explicites.

## Phaser

- Les agents encapsulent leur représentation graphique.
- Le pathfinding utilise les coordonnées de grille.
- Une animation ne constitue jamais la source de vérité métier.
- La suppression d’un agent doit libérer ses objets Phaser et ses boucles.

## Commits et pull requests

Les commits utilisent un verbe à l’infinitif et restent ciblés :

```text
Ajouter la sensibilité des clients aux prix
Extraire le calcul du coût moyen du stock
Documenter le format de sauvegarde
```

La pull request précise :

- le besoin ;
- les changements ;
- les impacts sur le gameplay ;
- les impacts de sauvegarde ;
- les vérifications réalisées ;
- les limites connues.

## Définition de terminé

Une fonctionnalité est terminée lorsqu’elle :

- possède une règle métier identifiable ;
- fournit un retour visible au joueur ;
- ne casse pas les sauvegardes existantes ou inclut une migration ;
- passe le typecheck et le build ;
- est documentée lorsque son architecture n’est pas évidente.
