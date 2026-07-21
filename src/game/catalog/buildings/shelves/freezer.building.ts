import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'freezer', category: 'shelf', name: 'Congélateur',
  description: 'Meuble de vente pour produits surgelés.',
  width: 1, height: 3, price: 450, color: 0x38bdf8, renderer: 'freezer',
  toolbar: { icon: '❄️', order: 40 },
  layout: { columns: 3, levels: 3, compartmentType: 'freezer-shelf' },
  allowedProductCategories: ['frozen'], refrigerated: true, frozen: true,
  electricityCostPerDay: 18, customerPickupTimeMs: 1100,
})