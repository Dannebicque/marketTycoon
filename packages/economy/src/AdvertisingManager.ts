export type AdvertisingMedium = 'flyer' | 'local-radio' | 'regional-radio' | 'local-tv' | 'regional-tv'
export type AdvertisingStatus = 'scheduled' | 'active' | 'finished' | 'cancelled'

export interface AdvertisingMediumDefinition {
  key: AdvertisingMedium
  name: string
  dailyCost: number
  trafficLift: number
  description: string
}

export interface AdvertisingCampaign {
  id: string
  medium: AdvertisingMedium
  startDay: number
  endDay: number
  totalCost: number
  trafficLift: number
  createdAt: number
  cancelledAt?: number
}

export interface AdvertisingState { nextCampaign?: number; campaigns?: AdvertisingCampaign[] }

export const ADVERTISING_MEDIA: AdvertisingMediumDefinition[] = [
  { key: 'flyer', name: 'Prospectus local', dailyCost: 18, trafficLift: .10, description: 'Diffusion de proximité, peu coûteuse mais effet limité.' },
  { key: 'local-radio', name: 'Radio locale', dailyCost: 45, trafficLift: .22, description: 'Bonne couverture de la zone commerciale.' },
  { key: 'regional-radio', name: 'Radio régionale', dailyCost: 90, trafficLift: .38, description: 'Couverture large et fréquentation renforcée.' },
  { key: 'local-tv', name: 'Télévision locale', dailyCost: 150, trafficLift: .55, description: 'Campagne visible avec un coût important.' },
  { key: 'regional-tv', name: 'Télévision régionale', dailyCost: 280, trafficLift: .85, description: 'Très forte visibilité sur toute la région.' },
]

export class AdvertisingManager {
  private campaigns: AdvertisingCampaign[] = []
  private nextCampaign = 1

  quote(medium: AdvertisingMedium, startDay: number, endDay: number) {
    const definition = ADVERTISING_MEDIA.find(item => item.key === medium)
    const start = Math.max(1, Math.floor(startDay))
    const end = Math.max(start, Math.floor(endDay))
    if (!definition) return null
    const duration = end - start + 1
    return { definition, duration, totalCost: definition.dailyCost * duration }
  }

  schedule(medium: AdvertisingMedium, startDay: number, endDay: number) {
    const quote = this.quote(medium, startDay, endDay)
    if (!quote) return null
    const campaign: AdvertisingCampaign = {
      id: `AD-${this.nextCampaign++}`,
      medium,
      startDay: Math.max(1, Math.floor(startDay)),
      endDay: Math.max(Math.max(1, Math.floor(startDay)), Math.floor(endDay)),
      totalCost: quote.totalCost,
      trafficLift: quote.definition.trafficLift,
      createdAt: Date.now(),
    }
    this.campaigns.push(campaign)
    return { ...campaign }
  }

  cancel(id: string) {
    const campaign = this.campaigns.find(item => item.id === id)
    if (!campaign || campaign.cancelledAt) return false
    campaign.cancelledAt = Date.now()
    return true
  }

  getStatus(campaign: AdvertisingCampaign, day: number): AdvertisingStatus {
    if (campaign.cancelledAt) return 'cancelled'
    if (day < campaign.startDay) return 'scheduled'
    if (day > campaign.endDay) return 'finished'
    return 'active'
  }

  getCampaigns() { return this.campaigns.map(item => ({ ...item })) }
  getActive(day: number) { return this.campaigns.filter(item => this.getStatus(item, day) === 'active').map(item => ({ ...item })) }
  getTrafficMultiplier(day: number) { return 1 + this.getActive(day).reduce((total, item) => total + item.trafficLift, 0) }
  getMedium(key: AdvertisingMedium) { return ADVERTISING_MEDIA.find(item => item.key === key) }
  exportState(): AdvertisingState { return { nextCampaign: this.nextCampaign, campaigns: this.getCampaigns() } }
  importState(state?: AdvertisingState) { this.nextCampaign = Math.max(1, state?.nextCampaign ?? 1); this.campaigns = (state?.campaigns ?? []).map(item => ({ ...item })) }
}

export const advertisingManager = new AdvertisingManager()
