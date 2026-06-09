// API route: POST /api/rides/request
// Creates a new ride request and finds a matching driver

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { findNearestDriver } from "@/lib/matching"
import { calculateRideFare } from "@/lib/fare"
import type { User, UserRole } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only riders can request rides
    if (user.role !== "RIDER") {
      return NextResponse.json(
        { success: false, error: "Only riders can request rides" },
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { pickupLat, pickupLng, pickupAddr, dropoffLat, dropoffLng, dropoffAddr } = body

    // Validate required fields
    if (pickupLat === undefined || pickupLng === undefined || dropoffLat === undefined || dropoffLng === undefined) {
      return NextResponse.json(
        { success: false, error: "Pickup and dropoff locations are required" },
        { status: 400 }
      )
    }

    // Calculate the estimated fare
    const fare = calculateRideFare(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng }
    )

    // Create the ride request in the database
    const ride = await prisma.ride.create({
      data: {
        riderId: user.userId,
        pickupLat,
        pickupLng,
        pickupAddr: pickupAddr || null,
        dropoffLat,
        dropoffLng,
        dropoffAddr: dropoffAddr || null,
        status: "PENDING",
        fare: Math.round(fare * 100) / 100, // Round to 2 decimal places
      },
    })

    // Find online drivers near the pickup location
    const onlineDrivers = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        isOnline: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
    })

    // Cast drivers to include required fields for the matching algorithm
    const driversWithLocation = onlineDrivers.map((driver) => ({
      ...driver,
      role: driver.role as UserRole,
      currentLat: driver.currentLat!,
      currentLng: driver.currentLng!,
    })) as (User & { currentLat: number; currentLng: number })[]

    // Find the nearest driver
    const matchedDriver = findNearestDriver(
      { lat: pickupLat, lng: pickupLng },
      driversWithLocation
    )

    // Return the ride details and matched driver (if any)
    return NextResponse.json({
      success: true,
      data: {
        ride: {
          id: ride.id,
          pickupLat: ride.pickupLat,
          pickupLng: ride.pickupLng,
          pickupAddr: ride.pickupAddr,
          dropoffLat: ride.dropoffLat,
          dropoffLng: ride.dropoffLng,
          dropoffAddr: ride.dropoffAddr,
          status: ride.status,
          fare: ride.fare,
          createdAt: ride.createdAt,
        },
        matchedDriver: matchedDriver
          ? {
              id: matchedDriver.id,
              name: matchedDriver.name,
              distance: Math.round(matchedDriver.distance * 100) / 100,
              rating: 4.5, // Placeholder rating (in a real app, calculate from actual ratings)
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Ride request error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while requesting a ride" },
      { status: 500 }
    )
  }
}
