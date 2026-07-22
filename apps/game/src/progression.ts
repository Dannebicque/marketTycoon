import { ProgressionManager } from '@market-tycoon/progression'

/**
 * Projection de progression de la partie courante.
 * Elle écoute le bus métier et reste indépendante de Vue et Phaser.
 */
export const progression = new ProgressionManager()
