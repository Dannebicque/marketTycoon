export type PlacementInvalidReason =
  | 'outside-grid'
  | 'outside-store'
  | 'occupied'
  | 'zone-incompatible'
  | 'insufficient-funds'
  | 'invalid-footprint'
  | 'unknown'

export interface PlacementValidationResult {
  valid: boolean
  reason?: PlacementInvalidReason
  message?: string
}

export function validPlacement(): PlacementValidationResult {
  return { valid: true }
}

export function invalidPlacement(reason: PlacementInvalidReason, message: string): PlacementValidationResult {
  return { valid: false, reason, message }
}
