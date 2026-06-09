// Authentication utilities: JWT creation/verification, password hashing, middleware

import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"
import type { JWTPayload } from "./types"

// Secret key for signing JWTs
// In production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || "ride-hailing-jwt-secret-key-2026"

// Token expiration time
const JWT_EXPIRES_IN = "7d"

// Hash a plaintext password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare a plaintext password with a hashed password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Create a signed JWT for a user
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verify and decode a JWT
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Extract the authenticated user from a Next.js request
// Returns the payload if the token is valid, or null if not authenticated
export function getUserFromRequest(
  request: NextRequest
): JWTPayload | null {
  // Try to get the token from the Authorization header
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7) // Remove "Bearer " prefix
  return verifyToken(token)
}

// Extract the authenticated user from a cookie (for server components)
export function getUserFromCookie(cookieValue: string | undefined): JWTPayload | null {
  if (!cookieValue) return null
  return verifyToken(cookieValue)
}
