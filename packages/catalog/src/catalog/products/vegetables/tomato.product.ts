import { defineProduct } from '../../../definitions'
export default defineProduct({
  key: 'tomato', category: 'vegetable', name: 'Tomates', shortName: 'TOM',
  salePrice: 4, purchasePrice: 1.8, color: 0xdc2626, shelfLifeDays: 4,
  capacities: { 'fruit-bin': 36 },
})