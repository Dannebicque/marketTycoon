import { defineProduct } from '../../../definitions'

export default defineProduct({
  key: 'canned-food', category: 'grocery', name: 'Conserves', shortName: 'CONS',
  salePrice: 4.5, purchasePrice: 2.1, color: 0xb07a4f,
  capacities: { 'standard-shelf': 24 },
})