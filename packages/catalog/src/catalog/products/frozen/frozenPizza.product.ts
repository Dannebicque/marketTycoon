import { defineProduct } from '../../../definitions'
export default defineProduct({
  key: 'frozen-pizza', category: 'frozen', name: 'Pizza surgelée', shortName: 'PIZZ',
  salePrice: 7, purchasePrice: 3.8, color: 0x60a5fa, requiresFreezing: true,
  capacities: { 'freezer-shelf': 14 },
})