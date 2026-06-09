// API route: POST /api/auth/register
// Creates a new user account (rider or driver)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword, createToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { name, email, password, role, phone } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Name, email, password, and role are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== "RIDER" && role !== "DRIVER") {
      return NextResponse.json(
        { success: false, error: "Role must be either RIDER or DRIVER" },
        { status: 400 }
      )
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
      },
    })

    // Generate a JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role as "RIDER" | "DRIVER",
    })

    // Return the user data (without password) and the token
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
          token,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 }
    )
  }
}
