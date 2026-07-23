export type LoanStatus = 'active' | 'paid' | 'defaulted'

export interface LoanOffer {
  key: string
  name: string
  minAmount: number
  maxAmount: number
  interestRate: number
  durationDays: number
  setupFeeRate: number
  description: string
}

export interface LoanPayment {
  day: number
  amount: number
  principal: number
  interest: number
  paid: number
  missed: number
}

export interface LoanContract {
  id: string
  offerKey: string
  principal: number
  interestRate: number
  durationDays: number
  setupFee: number
  totalRepayable: number
  installment: number
  startDay: number
  nextPaymentDay: number
  remainingBalance: number
  payments: LoanPayment[]
  status: LoanStatus
  createdAt: number
}

export interface LoanState { nextLoan?: number; loans?: LoanContract[] }

export const LOAN_OFFERS: LoanOffer[] = [
  { key: 'micro', name: 'Microcrédit commercial', minAmount: 250, maxAmount: 1_500, interestRate: .08, durationDays: 10, setupFeeRate: .01, description: 'Financement court et accessible, mais taux élevé.' },
  { key: 'standard', name: 'Prêt professionnel', minAmount: 1_000, maxAmount: 8_000, interestRate: .05, durationDays: 20, setupFeeRate: .015, description: 'Équilibre entre durée, capacité et coût.' },
  { key: 'investment', name: 'Crédit investissement', minAmount: 5_000, maxAmount: 25_000, interestRate: .035, durationDays: 40, setupFeeRate: .02, description: 'Financement long destiné aux agrandissements.' },
]

export class LoanManager {
  private loans: LoanContract[] = []
  private nextLoan = 1
  private processedDays = new Set<number>()

  quote(offerKey: string, amount: number, startDay: number) {
    const offer = LOAN_OFFERS.find(item => item.key === offerKey)
    const principal = Math.round(Number(amount) * 100) / 100
    if (!offer || principal < offer.minAmount || principal > offer.maxAmount) return null
    const setupFee = round(principal * offer.setupFeeRate)
    const interest = round(principal * offer.interestRate)
    const totalRepayable = round(principal + interest)
    const installment = round(totalRepayable / offer.durationDays)
    return { offer, principal, setupFee, totalRepayable, installment, netCash: round(principal - setupFee), startDay: Math.max(1, Math.floor(startDay)) }
  }

  take(offerKey: string, amount: number, startDay: number) {
    const quote = this.quote(offerKey, amount, startDay)
    if (!quote) return null
    const loan: LoanContract = {
      id: `LOAN-${this.nextLoan++}`,
      offerKey,
      principal: quote.principal,
      interestRate: quote.offer.interestRate,
      durationDays: quote.offer.durationDays,
      setupFee: quote.setupFee,
      totalRepayable: quote.totalRepayable,
      installment: quote.installment,
      startDay: quote.startDay,
      nextPaymentDay: quote.startDay + 1,
      remainingBalance: quote.totalRepayable,
      payments: [],
      status: 'active',
      createdAt: Date.now(),
    }
    this.loans.push(loan)
    return { loan: cloneLoan(loan), netCash: quote.netCash }
  }

  processDay(day: number, availableCash: number) {
    const normalizedDay = Math.max(1, Math.floor(day))
    if (this.processedDays.has(normalizedDay)) return { paid: 0, missed: 0, details: [] as LoanPayment[] }
    this.processedDays.add(normalizedDay)
    let cash = Math.max(0, availableCash)
    let paidTotal = 0
    let missedTotal = 0
    const details: LoanPayment[] = []
    for (const loan of this.loans.filter(item => item.status === 'active' && item.nextPaymentDay <= normalizedDay)) {
      const due = round(Math.min(loan.installment, loan.remainingBalance))
      const paid = round(Math.min(cash, due))
      const missed = round(due - paid)
      const interestShare = round(due * (loan.totalRepayable - loan.principal) / loan.totalRepayable)
      const payment: LoanPayment = { day: normalizedDay, amount: due, principal: round(due - interestShare), interest: interestShare, paid, missed }
      loan.payments.push(payment)
      loan.remainingBalance = round(loan.remainingBalance - paid)
      loan.nextPaymentDay = normalizedDay + 1
      cash = round(cash - paid)
      paidTotal = round(paidTotal + paid)
      missedTotal = round(missedTotal + missed)
      if (missed > 0) {
        loan.remainingBalance = round(loan.remainingBalance + missed * .05)
        if (loan.payments.filter(item => item.missed > 0).length >= 3) loan.status = 'defaulted'
      }
      if (loan.remainingBalance <= .01) { loan.remainingBalance = 0; loan.status = 'paid' }
      details.push({ ...payment })
    }
    return { paid: paidTotal, missed: missedTotal, details }
  }

  repayEarly(id: string, availableCash: number) {
    const loan = this.loans.find(item => item.id === id && item.status === 'active')
    if (!loan || availableCash < loan.remainingBalance) return null
    const amount = loan.remainingBalance
    loan.remainingBalance = 0
    loan.status = 'paid'
    loan.payments.push({ day: loan.nextPaymentDay, amount, principal: amount, interest: 0, paid: amount, missed: 0 })
    return amount
  }

  getLoans() { return this.loans.map(cloneLoan) }
  getOffers() { return LOAN_OFFERS.map(item => ({ ...item })) }
  getOutstandingBalance() { return round(this.loans.filter(item => item.status === 'active' || item.status === 'defaulted').reduce((sum, item) => sum + item.remainingBalance, 0)) }
  getNextInstallments() { return round(this.loans.filter(item => item.status === 'active').reduce((sum, item) => sum + Math.min(item.installment, item.remainingBalance), 0)) }
  exportState(): LoanState { return { nextLoan: this.nextLoan, loans: this.getLoans() } }
  importState(state?: LoanState) { this.nextLoan = Math.max(1, state?.nextLoan ?? 1); this.loans = (state?.loans ?? []).map(cloneLoan); this.processedDays.clear() }
}

export const loanManager = new LoanManager()
function round(value: number) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100 }
function cloneLoan(loan: LoanContract): LoanContract { return { ...loan, payments: loan.payments.map(item => ({ ...item })) } }
