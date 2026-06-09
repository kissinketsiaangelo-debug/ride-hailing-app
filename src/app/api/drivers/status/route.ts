// API route: PATCH /api/drivers/status
// Toggles a driver's online/offline status or updates their GPS location

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Only drivers can update their status
    if (user.role !== "DRIVER") {
      return NextResponse.json(
        { success: false, error: "Only drivers can update their status" },
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { isOnline, lat, lng } = body

    // Build the update data
    const updateData: Record<string, unknown> = {}

    if (typeof isOnline === "boolean") {
      updateData.isOnline = isOnline
    }

    if (lat !== undefined && lng !== undefined) {
      updateData.currentLat = lat
      updateData.currentLng = lng
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      )
    }

    // Update the driver
    const driver = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        isOnline: true,
        currentLat: true,
        currentLng: true,
      },
    })

    return NextResponse.json({ success: true, data: driver })
  } catch (error) {
    console.error("Driver status update error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
