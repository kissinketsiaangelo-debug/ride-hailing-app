// API route: GET /api/drivers/nearby
// Returns online drivers near a given location with vehicle info

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { haversineDistance } from "@/lib/matching"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    const onlineDrivers = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        isOnline: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        currentLat: true,
        currentLng: true,
        vehicle: {
          select: {
            make: true,
            model: true,
            color: true,
            plate: true,
            type: true,
          },
        },
      },
    })

    const driversWithDistance = onlineDrivers
      .map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        lat: d.currentLat!,
        lng: d.currentLng!,
        distance: haversineDistance({ lat, lng }, { lat: d.currentLat!, lng: d.currentLng! }),
        vehicle: d.vehicle,
      }))
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json({
      success: true,
      data: {
        count: driversWithDistance.length,
        drivers: driversWithDistance,
      },
    })
  } catch (error) {
    console.error("Nearby drivers error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
