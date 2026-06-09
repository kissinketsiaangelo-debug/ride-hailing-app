// Shared TypeScript types for the ride-hailing application

// User roles
export type UserRole = "RIDER" | "DRIVER"

// Ride statuses
export type RideStatus = "PENDING" | "ACCEPTED" | "STARTED" | "COMPLETED" | "CANCELLED"

// Delivery statuses
export type DeliveryStatus = "PENDING" | "ACCEPTED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"

// User type matching Prisma schema
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  isOnline: boolean
  currentLat: number | null
  currentLng: number | null
  totalEarnings: number
  createdAt: Date
}

// User without password (safe to return to client)
export type SafeUser = Omit<User, "password">

// Ride type
export type Ride = {
  id: string
  riderId: string
  driverId: string | null
  pickupLat: number
  pickupLng: number
  pickupAddr: string | null
  dropoffLat: number
  dropoffLng: number
  dropoffAddr: string | null
  status: RideStatus
  fare: number | null
  createdAt: Date
  updatedAt: Date
  rider?: SafeUser
  driver?: SafeUser
}

// Delivery type
export type Delivery = {
  id: string
  senderId: string
  driverId: string | null
  pickupLat: number
  pickupLng: number
  pickupAddr: string | null
  dropoffLat: number
  dropoffLng: number
  dropoffAddr: string | null
  packageDesc: string | null
  packageWeight: number | null
  status: DeliveryStatus
  fee: number | null
  createdAt: Date
  updatedAt: Date
}

// GPS location point
export type Location = {
  lat: number
  lng: number
}

// Ride request input from the client
export type RideRequestInput = {
  pickupLat: number
  pickupLng: number
  pickupAddr?: string
  dropoffLat: number
  dropoffLng: number
  dropoffAddr?: string
}

// Delivery request input from the client
export type DeliveryRequestInput = {
  pickupLat: number
  pickupLng: number
  pickupAddr?: string
  dropoffLat: number
  dropoffLng: number
  dropoffAddr?: string
  packageDesc?: string
  packageWeight?: number
}

// JWT payload stored in the token
export type JWTPayload = {
  userId: string
  email: string
  role: UserRole
}

// API response wrapper
export type APIResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}
