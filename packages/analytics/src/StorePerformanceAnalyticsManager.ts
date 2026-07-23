export interface StorePerformanceRecord {
  day: number
  revenue: number
  constructionExpenses: number
  merchandiseExpenses: number
  operatingExpenses: number
  costOfGoodsSold: number
  grossMargin: number
  stockValue: number
  profit: number
  servedCustomers: number
  lostCustomers: number
  articlesSold: number
  averageSatisfaction: number
  averageQueueSeconds: number
  recordedAt: number
}

export interface StorePerformanceAnalyticsState {
  records: StorePerformanceRecord[]
}

export interface StorePerformanceSummary {
  days: number
  revenue: number
  grossMargin: number
  profit: number
  averageDailyRevenue: number
  averageDailyProfit: number
  averageSatisfaction: number
  conversionRate: number
  servedCustomers: number
  lostCustomers: number
  articlesSold: number
  latestStockValue: number
}

const MAX_RECORDS = 365

export class StorePerformanceAnalyticsManager {
  private records: StorePerformanceRecord[] = []

  record(input: Omit<StorePerformanceRecord, 'recordedAt'> & { recordedAt?: number }) {
    const record: StorePerformanceRecord = {
      ...input,
      recordedAt: input.recordedAt ?? Date.now(),
    }
    const existing = this.records.findIndex(item => item.day === record.day)
    if (existing >= 0) this.records.splice(existing, 1, record)
    else this.records.push(record)
    this.records.sort((a, b) => a.day - b.day)
    if (this.records.length > MAX_RECORDS) this.records.splice(0, this.records.length - MAX_RECORDS)
    return { ...record }
  }

  getRecords(limit?: number) {
    const records = limit === undefined ? this.records : this.records.slice(-Math.max(0, limit))
    return records.map(item => ({ ...item }))
  }

  getSummary(limit?: number): StorePerformanceSummary {
    const records = limit === undefined ? this.records : this.records.slice(-Math.max(0, limit))
    const servedCustomers = sum(records, item => item.servedCustomers)
    const lostCustomers = sum(records, item => item.lostCustomers)
    const visitors = servedCustomers + lostCustomers
    return {
      days: records.length,
      revenue: sum(records, item => item.revenue),
      grossMargin: sum(records, item => item.grossMargin),
      profit: sum(records, item => item.profit),
      averageDailyRevenue: average(records, item => item.revenue),
      averageDailyProfit: average(records, item => item.profit),
      averageSatisfaction: weightedAverage(records, item => item.averageSatisfaction, item => Math.max(1, item.servedCustomers + item.lostCustomers)),
      conversionRate: visitors ? servedCustomers / visitors : 0,
      servedCustomers,
      lostCustomers,
      articlesSold: sum(records, item => item.articlesSold),
      latestStockValue: records.at(-1)?.stockValue ?? 0,
    }
  }

  exportState(): StorePerformanceAnalyticsState {
    return { records: this.records.map(item => ({ ...item })) }
  }

  importState(state?: StorePerformanceAnalyticsState) {
    this.records = (state?.records ?? [])
      .slice(-MAX_RECORDS)
      .map(item => ({ ...item }))
      .sort((a, b) => a.day - b.day)
  }

  clear() { this.records = [] }
}

function sum<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0)
}

function average<T>(items: T[], selector: (item: T) => number) {
  return items.length ? sum(items, selector) / items.length : 0
}

function weightedAverage<T>(items: T[], selector: (item: T) => number, weight: (item: T) => number) {
  const totalWeight = sum(items, weight)
  return totalWeight ? items.reduce((total, item) => total + selector(item) * weight(item), 0) / totalWeight : 0
}
