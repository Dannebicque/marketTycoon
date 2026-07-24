import { defineProduct } from '../../../definitions'
export default defineProduct({
  key: 'yogurt', category: 'fresh', name: 'Yaourts', shortName: 'YAO',
  salePrice: 5, purchasePrice: 2.7, color: 0x22c55e, shelfLifeDays: 8,
  requiresRefrigeration: true,
  capacities: { 'refrigerated-shelf': 24 },
})