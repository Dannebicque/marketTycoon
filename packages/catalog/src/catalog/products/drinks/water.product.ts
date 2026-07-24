import { defineProduct } from '../../../definitions'
export default defineProduct({
  key: 'water', category: 'drink', name: 'Eau', shortName: 'EAU',
  salePrice: 2, purchasePrice: .7, color: 0x38bdf8,
  capacities: { 'standard-shelf': 20 },
})