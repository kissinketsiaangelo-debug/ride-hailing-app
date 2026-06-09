// API route: POST /api/ratings
// Creates a rating for a completed ride

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

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
    const { rideId, toUserId, score, comment } = body

    // Validate required fields
    if (!rideId || !toUserId || score === undefined) {
      return NextResponse.json(
        { success: false, error: "rideId, toUserId, and score are required" },
        { status: 400 }
      )
    }

    // Validate score range
    if (score < 1 || score > 5) {
      return NextResponse.json(
        { success: false, error: "Score must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Check if the ride exists and is completed
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    })

    if (!ride) {
      return NextResponse.json(
        { success: false, error: "Ride not found" },
        { status: 404 }
      )
    }

    if (ride.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Can only rate completed rides" },
        { status: 400 }
      )
    }

    // Check if a rating already exists for this ride
    const existingRating = await prisma.rating.findUnique({
      where: { rideId },
    })

    if (existingRating) {
      return NextResponse.json(
        { success: false, error: "This ride has already been rated" },
        { status: 409 }
      )
    }

    // Create the rating
    const rating = await prisma.rating.create({
      data: {
        rideId,
        fromUserId: user.userId,
        toUserId,
        score,
        comment: comment || null,
      },
    })

    return NextResponse.json(
      { success: true, data: rating },
      { status: 201 }
    )
  } catch (error) {
    console.error("Rating creation error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while creating the rating" },
      { status: 500 }
    )
  }
}

// GET /api/ratings?userId=xxx - Get ratings for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      )
    }

    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate average rating
    const avgScore =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0

    return NextResponse.json({
      success: true,
      data: {
        ratings,
        average: Math.round(avgScore * 10) / 10,
        count: ratings.length,
      },
    })
  } catch (error) {
    console.error("Get ratings error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
