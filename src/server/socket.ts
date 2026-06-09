// Socket.io server for real-time communication
// Handles driver location updates, ride matching, and GPS tracking

import { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"

let io: SocketIOServer | null = null

// Map of connected users: userId -> socketId
const connectedUsers = new Map<string, string>()
// Map of driver locations: userId -> { lat, lng }
const driverLocations = new Map<string, { lat: number; lng: number }>()

// Initialize the Socket.io server
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // When a user comes online, register their socket
    socket.on("register", (userId: string) => {
      connectedUsers.set(userId, socket.id)
      socket.data.userId = userId
      console.log(`[Socket] User registered: ${userId} -> ${socket.id}`)
    })

    // Driver sends their current GPS location
    socket.on("updateLocation", (data: { userId: string; lat: number; lng: number }) => {
      driverLocations.set(data.userId, { lat: data.lat, lng: data.lng })
      // Broadcast to all connected clients (or a room)
      io?.emit("driverLocationUpdate", {
        driverId: data.userId,
        lat: data.lat,
        lng: data.lng,
      })
    })

    // Rider requests a ride match
    socket.on("requestMatch", (data: { rideId: string; pickupLat: number; pickupLng: number }) => {
      // Find nearby drivers and emit a notification to them
      const nearbyDrivers = findNearbyDrivers(data.pickupLat, data.pickupLng)
      nearbyDrivers.forEach((driverId) => {
        const driverSocketId = connectedUsers.get(driverId)
        if (driverSocketId) {
          io?.to(driverSocketId).emit("newRideRequest", {
            rideId: data.rideId,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
          })
        }
      })
    })

    // Driver accepts a ride
    socket.on("acceptRide", (data: { rideId: string; driverId: string; riderId: string }) => {
      const riderSocketId = connectedUsers.get(data.riderId)
      if (riderSocketId) {
        io?.to(riderSocketId).emit("rideAccepted", {
          rideId: data.rideId,
          driverId: data.driverId,
        })
      }
    })

    // Real-time ride tracking: driver sends GPS during a trip
    socket.on("trackRide", (data: { rideId: string; lat: number; lng: number; riderId: string }) => {
      const riderSocketId = connectedUsers.get(data.riderId)
      if (riderSocketId) {
        io?.to(riderSocketId).emit("rideTracking", {
          rideId: data.rideId,
          lat: data.lat,
          lng: data.lng,
        })
      }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      const userId = socket.data.userId
      if (userId) {
        connectedUsers.delete(userId)
        driverLocations.delete(userId)
        console.log(`[Socket] User disconnected: ${userId}`)
      }
    })
  })

  return io
}

// Get the Socket.io server instance
export function getIO(): SocketIOServer | null {
  return io
}

// Find nearby drivers within a radius using stored locations
function findNearbyDrivers(lat: number, lng: number, radiusKm: number = 10): string[] {
  const nearby: string[] = []
  driverLocations.forEach((location, driverId) => {
    const distance = haversine(lat, lng, location.lat, location.lng)
    if (distance <= radiusKm) {
      nearby.push(driverId)
    }
  })
  return nearby
}

// Haversine formula for distance calculation
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
