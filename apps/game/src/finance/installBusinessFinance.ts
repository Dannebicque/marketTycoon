import { advertisingManager, loanManager, type AdvertisingMedium, type AdvertisingState, type LoanState } from '@market-tycoon/economy'
import { StoreSimulation } from '@market-tycoon/simulation-engine'
import { StoreScene } from '../phaser/StoreScene'

export const ADVERTISING_STORAGE_KEY = 'market-tycoon.advertising.v1'
export const LOANS_STORAGE_KEY = 'market-tycoon.loans.v1'

let installed = false
let activeSimulation: StoreSimulation | null = null
let currentDay = 1
let trafficTimer: number | undefined

export function installBusinessFinance() {
  if (installed) return
  installed = true
  restoreBusinessFinance()

  const originalSetCurrentDay = StoreSimulation.prototype.setCurrentDay
  StoreSimulation.prototype.setCurrentDay = function setCurrentDayWithFinance(day: number) {
    activeSimulation = this
    currentDay = Math.max(1, Math.floor(day))
    const result = originalSetCurrentDay.call(this, day)
    processLoanInstallments(this, currentDay)
    return result
  }

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithAdvertising() {
    originalCreate.call(this)
    if (trafficTimer) window.clearInterval(trafficTimer)
    trafficTimer = window.setInterval(() => {
      if (this.currentMinutes >= 20 * 60 || this.currentMinutes < 8 * 60) return
      const multiplier = advertisingManager.getTrafficMultiplier(this.day)
      const extraChance = Math.min(.9, Math.max(0, multiplier - 1) * .32)
      if (Math.random() < extraChance) void this.spawnCustomer()
    }, 4_000)
  }

  window.addEventListener('beforeunload', persistBusinessFinance)
}

export function scheduleAdvertising(medium: AdvertisingMedium, startDay: number, endDay: number) {
  if (!activeSimulation) return { ok: false as const, reason: 'Simulation indisponible.' }
  const quote = advertisingManager.quote(medium, startDay, endDay)
  if (!quote) return { ok: false as const, reason: 'Campagne invalide.' }
  if (activeSimulation.metrics.cash < quote.totalCost) return { ok: false as const, reason: `Trésorerie insuffisante : il manque ${money(quote.totalCost - activeSimulation.metrics.cash)}.` }
  activeSimulation.metrics.cash -= quote.totalCost
  activeSimulation.metrics.operatingExpenses += quote.totalCost
  const campaign = advertisingManager.schedule(medium, startDay, endDay)
  if (!campaign) {
    activeSimulation.metrics.cash += quote.totalCost
    activeSimulation.metrics.operatingExpenses = Math.max(0, activeSimulation.metrics.operatingExpenses - quote.totalCost)
    return { ok: false as const, reason: 'Création de campagne impossible.' }
  }
  persistBusinessFinance()
  return { ok: true as const, campaign }
}

export function takeBusinessLoan(offerKey: string, amount: number, day = currentDay) {
  if (!activeSimulation) return { ok: false as const, reason: 'Simulation indisponible.' }
  const result = loanManager.take(offerKey, amount, day)
  if (!result) return { ok: false as const, reason: 'Montant ou offre de prêt invalide.' }
  activeSimulation.metrics.cash += result.netCash
  activeSimulation.metrics.operatingExpenses += result.loan.setupFee
  persistBusinessFinance()
  return { ok: true as const, ...result }
}

export function repayBusinessLoan(id: string) {
  if (!activeSimulation) return { ok: false as const, reason: 'Simulation indisponible.' }
  const amount = loanManager.repayEarly(id, activeSimulation.metrics.cash)
  if (amount === null) return { ok: false as const, reason: 'Trésorerie insuffisante pour solder cet emprunt.' }
  activeSimulation.metrics.cash -= amount
  persistBusinessFinance()
  return { ok: true as const, amount }
}

export function getBusinessFinanceSnapshot() {
  return {
    cash: activeSimulation?.metrics.cash ?? 0,
    currentDay,
    campaigns: advertisingManager.getCampaigns(),
    loans: loanManager.getLoans(),
    outstandingBalance: loanManager.getOutstandingBalance(),
    nextInstallments: loanManager.getNextInstallments(),
  }
}

export function persistBusinessFinance() {
  localStorage.setItem(ADVERTISING_STORAGE_KEY, JSON.stringify(advertisingManager.exportState()))
  localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(loanManager.exportState()))
}

export function restoreBusinessFinance() {
  try {
    const advertising = localStorage.getItem(ADVERTISING_STORAGE_KEY)
    advertisingManager.importState(advertising ? JSON.parse(advertising) as AdvertisingState : undefined)
  } catch { advertisingManager.importState() }
  try {
    const loans = localStorage.getItem(LOANS_STORAGE_KEY)
    loanManager.importState(loans ? JSON.parse(loans) as LoanState : undefined)
  } catch { loanManager.importState() }
}

function processLoanInstallments(simulation: StoreSimulation, day: number) {
  const result = loanManager.processDay(day, simulation.metrics.cash)
  if (!result.paid && !result.missed) return
  simulation.metrics.cash -= result.paid
  simulation.metrics.operatingExpenses += result.paid
  persistBusinessFinance()
  window.dispatchEvent(new CustomEvent('market-tycoon:loan-payment', { detail: result }))
}

function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.max(0, value)) }
