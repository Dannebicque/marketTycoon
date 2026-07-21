import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'express-checkout', category: 'checkout', name: 'Caisse express',
  description: 'Caisse très rapide limitée à dix articles.',
  width: 1, height: 1, price: 420, color: 0xf59e0b, renderer: 'express-checkout',
  toolbar: { icon: '⚡', order: 80 },
  scanTimePerArticleMs: 350, baseCheckoutTimeMs: 900,
  acceptedPayments: ['contactless', 'card', 'cash'], maxBasketSize: 10,
  requiresEmployee: true,
})
