// API route: POST /api/deliveries
// Creates a new delivery request

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { calculateDeliveryFee } from "@/lib/fare"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const {
      pickupLat,
      pickupLng,
      pickupAddr,
      dropoffLat,
      dropoffLng,
      dropoffAddr,
      packageDesc,
      packageWeight,
    } = body

    // Validate required fields
    if (
      pickupLat === undefined ||
      pickupLng === undefined ||
      dropoffLat === undefined ||
      dropoffLng === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Pickup and dropoff locations are required" },
        { status: 400 }
      )
    }

    // Calculate the delivery fee
    const fee = calculateDeliveryFee(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng },
      packageWeight || 0
    )

    // Create the delivery request
    const delivery = await prisma.delivery.create({
      data: {
        senderId: user.userId,
        pickupLat,
        pickupLng,
        pickupAddr: pickupAddr || null,
        dropoffLat,
        dropoffLng,
        dropoffAddr: dropoffAddr || null,
        packageDesc: packageDesc || null,
        packageWeight: packageWeight || null,
        status: "PENDING",
        fee: Math.round(fee * 100) / 100,
      },
    })

    return NextResponse.json(
      { success: true, data: delivery },
      { status: 201 }
    )
  } catch (error) {
    console.error("Delivery creation error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while creating the delivery" },
      { status: 500 }
    )
  }
}

// GET /api/deliveries - Get deliveries for the current user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Fetch deliveries based on user role
    let deliveries
    if (user.role === "DRIVER") {
      deliveries = await prisma.delivery.findMany({
        where: { driverId: user.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    } else {
      deliveries = await prisma.delivery.findMany({
        where: { senderId: user.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    }

    return NextResponse.json({ success: true, data: deliveries })
  } catch (error) {
    console.error("Get deliveries error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
