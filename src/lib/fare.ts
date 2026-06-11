// Fare calculation logic for rides and deliveries
// Uses a simple formula: base fare + distance rate + time rate (simulated)

import { haversineDistance } from "./matching"
import type { Location } from "./types"

// Configuration constants for fare calculation (in Ghana Cedis ₵)
const CONFIG = {
  // Ride fares
  rideBaseFare: 5, // Base fare in Ghana Cedis
  ridePerKmRate: 3, // Cost per kilometer
  ridePerMinuteRate: 0.5, // Cost per minute (simulated)
  rideMinFare: 10, // Minimum fare for any ride

  // Delivery fees
  deliveryBaseFee: 5,
  deliveryPerKmRate: 2,
  deliveryWeightSurcharge: 1, // Per kg surcharge
  deliveryMinFee: 10,
}

// Calculate the estimated fare for a ride between pickup and dropoff
export function calculateRideFare(
  pickup: Location,
  dropoff: Location
): number {
  const distanceKm = haversineDistance(pickup, dropoff)

  // Simulate time: assume average speed of 30 km/h
  const estimatedMinutes = (distanceKm / 30) * 60

  const fare =
    CONFIG.rideBaseFare +
    distanceKm * CONFIG.ridePerKmRate +
    estimatedMinutes * CONFIG.ridePerMinuteRate

  return Math.round(Math.max(fare, CONFIG.rideMinFare) * 100) / 100
}

// Calculate the estimated fee for a delivery
export function calculateDeliveryFee(
  pickup: Location,
  dropoff: Location,
  weightKg: number = 0
): number {
  const distanceKm = haversineDistance(pickup, dropoff)

  const fee =
    CONFIG.deliveryBaseFee +
    distanceKm * CONFIG.deliveryPerKmRate +
    weightKg * CONFIG.deliveryWeightSurcharge

  return Math.round(Math.max(fee, CONFIG.deliveryMinFee) * 100) / 100
}
