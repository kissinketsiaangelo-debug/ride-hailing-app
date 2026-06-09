// Driver matching algorithm using geographic proximity (Haversine formula)
// Finds the nearest available driver for a given pickup location

import type { Location, User } from "./types"

// Calculate the great-circle distance between two GPS coordinates using the Haversine formula
// Returns distance in kilometers
export function haversineDistance(point1: Location, point2: Location): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

// Find the nearest available driver from a list of online drivers
// Returns the closest driver, or null if no drivers are available within the search radius
export function findNearestDriver(
  pickupLocation: Location,
  onlineDrivers: (User & { currentLat: number; currentLng: number })[],
  maxRadiusKm: number = 10 // Default search radius of 10 km
): (User & { currentLat: number; currentLng: number; distance: number }) | null {
  if (onlineDrivers.length === 0) {
    return null
  }

  let nearestDriver: (User & { currentLat: number; currentLng: number; distance: number }) | null = null
  let nearestDistance = Infinity

  for (const driver of onlineDrivers) {
    const distance = haversineDistance(pickupLocation, {
      lat: driver.currentLat,
      lng: driver.currentLng,
    })

    if (distance <= maxRadiusKm && distance < nearestDistance) {
      nearestDistance = distance
      nearestDriver = { ...driver, distance }
    }
  }

  return nearestDriver
}

// Get the top N nearest drivers (useful for showing multiple options)
export function findNearestDrivers(
  pickupLocation: Location,
  onlineDrivers: (User & { currentLat: number; currentLng: number })[],
  count: number = 3,
  maxRadiusKm: number = 10
): (User & { currentLat: number; currentLng: number; distance: number })[] {
  const driversWithDistance = onlineDrivers
    .map((driver) => ({
      ...driver,
      distance: haversineDistance(pickupLocation, {
        lat: driver.currentLat,
        lng: driver.currentLng,
      }),
    }))
    .filter((driver) => driver.distance <= maxRadiusKm)
    .sort((a, b) => a.distance - b.distance)

  return driversWithDistance.slice(0, count)
}
