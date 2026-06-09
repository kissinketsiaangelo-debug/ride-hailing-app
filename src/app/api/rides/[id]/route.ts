// API route: GET/PATCH /api/rides/[id]
// Get ride details or update ride status (accept, start, complete, cancel)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

// GET /api/rides/[id] - Get details of a specific ride
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Fetch the ride with related user data
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        rider: {
          select: { id: true, name: true, email: true, phone: true },
        },
        driver: {
          select: { id: true, name: true, email: true, phone: true },
        },
        payment: true,
        rating: true,
      },
    })

    if (!ride) {
      return NextResponse.json(
        { success: false, error: "Ride not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: ride })
  } catch (error) {
    console.error("Get ride error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}

// PATCH /api/rides/[id] - Update ride status
// Used by drivers to accept rides, and by both parties to update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { status, driverId } = body

    // Validate the status
    const validStatuses = ["PENDING", "ACCEPTED", "STARTED", "COMPLETED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Build the update data
    const updateData: Record<string, unknown> = { status }

    // If a driver is accepting the ride, set the driverId
    if (status === "ACCEPTED" && driverId) {
      updateData.driverId = driverId
    }

    // Update the ride
    const ride = await prisma.ride.update({
      where: { id },
      data: updateData,
    })

    // If the ride is completed, create a payment record
    if (status === "COMPLETED" && ride.fare) {
      await prisma.payment.create({
        data: {
          rideId: ride.id,
          amount: ride.fare,
          method: "CARD",
          status: "COMPLETED",
        },
      })

      // Update the driver's earnings
      if (ride.driverId) {
        await prisma.user.update({
          where: { id: ride.driverId },
          data: {
            totalEarnings: { increment: ride.fare },
          },
        })
      }
    }

    return NextResponse.json({ success: true, data: ride })
  } catch (error) {
    console.error("Update ride error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
