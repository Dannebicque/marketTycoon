import type { PaymentMethod } from '@market-tycoon/catalog'

export function chooseCustomerPaymentMethod(
  accepted: PaymentMethod[] = ['contactless', 'card', 'cash'],
  random = Math.random,
): PaymentMethod {
  const available = accepted.length ? accepted : ['contactless', 'card', 'cash']
  const roll = random()
  const preferred: PaymentMethod = roll < 0.5 ? 'contactless' : roll < 0.85 ? 'card' : 'cash'
  return available.includes(preferred)
    ? preferred
    : available[Math.floor(random() * available.length)]
}

export function calculateQueueSatisfaction(queueTimeMs: number) {
  return Math.max(0, 100 - Math.round(queueTimeMs / 180))
}

export function calculateCheckoutSatisfaction(
  currentSatisfaction: number,
  checkoutDurationMs: number,
  incident: boolean,
) {
  return Math.max(15, currentSatisfaction - Math.round(checkoutDurationMs / 900) - (incident ? 15 : 0))
}

export function isCustomerImpatient(queueTimeMs: number, maximumQueueWaitMs: number) {
  return queueTimeMs >= maximumQueueWaitMs
}
