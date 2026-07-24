import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'self-checkout', category: 'checkout', name: 'Caisse automatique',
  description: 'Caisse compacte sans employé, réservée aux petits paniers.',
  width: 1, height: 1, price: 550, color: 0x06b6d4, renderer: 'self-checkout',
  toolbar: { icon: '🤖', order: 70 },
  scanTimePerArticleMs: 700, baseCheckoutTimeMs: 1800,
  acceptedPayments: ['contactless', 'card'], maxBasketSize: 12,
  requiresEmployee: false, breakdownChance: .12,
})
