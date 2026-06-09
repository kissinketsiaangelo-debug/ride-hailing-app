// API route: GET /api/payments
// Returns payment history for the current user
// Also: POST /api/payments to create a payment (for future use)

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

    // Fetch payments associated with the user's rides and deliveries
    // For riders: payments on rides where they are the rider
    // For drivers: payments on rides where they are the driver
    let payments
    if (user.role === "DRIVER") {
      payments = await prisma.payment.findMany({
        where: {
          ride: { driverId: user.userId },
        },
        include: {
          ride: {
            select: {
              id: true,
              pickupAddr: true,
              dropoffAddr: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    } else {
      payments = await prisma.payment.findMany({
        where: {
          ride: { riderId: user.userId },
        },
        include: {
          ride: {
            select: {
              id: true,
              pickupAddr: true,
              dropoffAddr: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    }

    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    console.error("Get payments error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
