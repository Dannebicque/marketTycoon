import { defineProduct } from '../../../definitions'

export default defineProduct({
  key: 'pasta', category: 'grocery', name: 'Pâtes', shortName: 'PÂTES',
  salePrice: 3.5, purchasePrice: 1.4, color: 0xd6a75f,
  capacities: { 'standard-shelf': 30 },
})