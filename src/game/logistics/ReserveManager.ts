import { ReserveManager as CoreReserveManager } from '@market-tycoon/economy'
import { productCatalogReader } from '../catalog/readers'

/**
 * Adaptateur temporaire conservant le constructeur historique sans argument.
 * Les nouveaux consommateurs doivent importer ReserveManager depuis
 * @market-tycoon/economy et injecter explicitement leur catalogue.
 */
export class ReserveManager extends CoreReserveManager {
  constructor() {
    super(productCatalogReader)
  }
}

export type {
  ReserveStockLine,
  StorageBuilding,
} from '@market-tycoon/economy'
