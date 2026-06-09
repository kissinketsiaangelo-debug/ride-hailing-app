// Fare calculation logic for rides and deliveries
// Uses a simple formula: base fare + distance rate + time rate (simulated)

import { haversineDistance } from "./matching"
import type { Location } from "./types"

// Configuration constants for fare calculation (in Nigerian Naira ₦)
const CONFIG = {
  // Ride fares
  rideBaseFare: 500, // Base fare in Naira
  ridePerKmRate: 150, // Cost per kilometer
  ridePerMinuteRate: 20, // Cost per minute (simulated)
  rideMinFare: 300, // Minimum fare for any ride

  // Delivery fees
  deliveryBaseFee: 300,
  deliveryPerKmRate: 100,
  deliveryWeightSurcharge: 50, // Per kg surcharge
  deliveryMinFee: 200,
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

  return Math.max(fare, CONFIG.rideMinFare)
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

  return Math.max(fee, CONFIG.deliveryMinFee)
}
