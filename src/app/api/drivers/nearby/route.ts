// API route: GET /api/drivers/nearby
// Returns online drivers near a given location

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get query parameters: lat, lng, radius
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    // Find all online drivers with their locations
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
        currentLat: true,
        currentLng: true,
      },
    })

    // Return the list of online drivers
    return NextResponse.json({
      success: true,
      data: {
        count: onlineDrivers.length,
        drivers: onlineDrivers,
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
