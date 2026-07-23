import type { CustomerBasketLine, CustomerBasketSummary } from './contracts'

export class CustomerBasket {
  private readonly lines: CustomerBasketLine[] = []

  add(line: CustomerBasketLine) {
    this.lines.push(line)
  }

  getLines() {
    return [...this.lines]
  }

  summarize(): CustomerBasketSummary {
    return summarizeCustomerBasket(this.lines)
  }
}

export function summarizeCustomerBasket(lines: CustomerBasketLine[]): CustomerBasketSummary {
  return {
    lines: [...lines],
    articleCount: lines.reduce((total, line) => total + line.quantity, 0),
    saleTotal: lines.reduce((total, line) => total + line.quantity * line.product.salePrice, 0),
    purchaseTotal: lines.reduce((total, line) => total + line.quantity * (line.unitCost ?? line.product.purchasePrice), 0),
  }
}
